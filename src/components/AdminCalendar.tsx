import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

const db = supabase as any;

// Helper function to format date without timezone conversion
const formatDateForDatabase = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface CalendarBooking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  professional_id: string;
  professional_name: string;
  customer_name: string;
  service_name: string;
  duration_minutes?: number;
}

interface Professional {
  id: string;
  name: string;
}

export const AdminCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  
  // Refs for scroll synchronization
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const gridScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadProfessionals();
  }, []);

  useEffect(() => {
    loadBookings();
    
    // Set up real-time subscription for bookings
    const bookingsSubscription = supabase
      .channel('calendar-bookings-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'bookings' },
        (payload) => {
          console.log('Calendar: Booking changed:', payload);
          // Reload bookings when any booking changes
          loadBookings();
        }
      )
      .subscribe();

    return () => {
      bookingsSubscription.unsubscribe();
    };
  }, [currentDate, selectedProfessional]);

  const loadProfessionals = async () => {
    try {
      const { data, error } = await db
        .from("professionals")
        .select("id, name")
        .order("name");

      if (error) throw error;
      // Filter out "Any professional" from the list
      const filteredProfessionals = (data || []).filter(
        (prof: any) => prof.name.toLowerCase() !== "any professional"
      );
      setProfessionals(filteredProfessionals);
    } catch (error) {
      console.error("Failed to load professionals:", error);
      toast.error("Failed to load professionals");
    }
  };

  const loadBookings = async () => {
    setLoading(true);
    try {
      // Load bookings for the selected date only (daily view)
      const dateStr = formatDateForDatabase(currentDate);
      
      console.log("Calendar loading bookings for date:", dateStr, "from:", currentDate.toDateString());

      let query = db
        .from("bookings")
        .select("*")
        .eq("booking_date", dateStr);

      if (selectedProfessional !== "all") {
        query = query.eq("professional_id", selectedProfessional);
      }

      const { data: bookingsData, error: bookingsError } = await query;

      if (bookingsError) throw bookingsError;

      // Load related data
      const { data: professionalsData } = await db
        .from("professionals")
        .select("id, name");

      const { data: servicesData } = await db
        .from("services")
        .select("id, name, duration_minutes");

      const { data: profilesData } = await db
        .from("profiles")
        .select("id, full_name");

      // Enrich bookings
      const enrichedBookings = (bookingsData || []).map((booking: any) => {
        const professional = professionalsData?.find((p: any) => p.id === booking.professional_id);
        const service = servicesData?.find((s: any) => s.id === booking.service_id);
        const profile = profilesData?.find((pr: any) => pr.id === booking.user_id);

        return {
          id: booking.id,
          booking_date: booking.booking_date,
          booking_time: booking.booking_time,
          status: booking.status,
          professional_id: booking.professional_id,
          professional_name: professional?.name || "Unknown",
          customer_name: profile?.full_name || "Unknown",
          service_name: service?.name || "Unknown",
          duration_minutes: service?.duration_minutes,
        };
      });

      console.log("Calendar loaded bookings:", enrichedBookings.map(b => ({
        date: b.booking_date,
        time: b.booking_time,
        customer: b.customer_name,
        professional: b.professional_name
      })));
      
      setBookings(enrichedBookings);
    } catch (error) {
      console.error("Failed to load bookings:", error);
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const getEndOfWeek = (date: Date) => {
    const start = getStartOfWeek(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return end;
  };

  const getDaysOfWeek = (): Date[] => {
    const start = getStartOfWeek(currentDate);
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getTimeSlots = (): string[] => {
    const slots: string[] = [];
    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Determine closing time based on day
    let closingHour = 18; // Default: 6 PM for Monday-Friday
    if (dayOfWeek === 6) {
      closingHour = 16; // Saturday: 4 PM
    } else if (dayOfWeek === 0) {
      return []; // Sunday: Closed
    }
    
    // Generate slots from 9 AM to closing time
    for (let hour = 9; hour < closingHour; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    // Add the final hour slot (e.g., 18:00 for 6 PM or 16:00 for 4 PM)
    slots.push(`${closingHour.toString().padStart(2, '0')}:00`);
    
    return slots;
  };

  const getBookingsForSlot = (date: Date, time: string) => {
    const dateStr = formatDateForDatabase(date);
    return bookings.filter(b => 
      b.booking_date === dateStr && 
      b.booking_time.substring(0, 5) === time
    );
  };

  // Check if a booking spans this time slot
  const isBookingInSlot = (booking: CalendarBooking, date: Date, time: string): boolean => {
    const dateStr = formatDateForDatabase(date);
    if (booking.booking_date !== dateStr) return false;

    const bookingStartTime = booking.booking_time.substring(0, 5);
    const [bookingHour, bookingMinute] = bookingStartTime.split(':').map(Number);
    const bookingStartMinutes = bookingHour * 60 + bookingMinute;

    const [slotHour, slotMinute] = time.split(':').map(Number);
    const slotStartMinutes = slotHour * 60 + slotMinute;

    // Always use 120 minutes (2 hours) for all bookings
    const duration = 120;
    const bookingEndMinutes = bookingStartMinutes + duration;

    return slotStartMinutes >= bookingStartMinutes && slotStartMinutes < bookingEndMinutes;
  };

  // Check if this is the first slot of a booking (to render the booking card)
  const isFirstSlotOfBooking = (booking: CalendarBooking, time: string): boolean => {
    return booking.booking_time.substring(0, 5) === time;
  };

  // Calculate how many slots a booking spans
  const getBookingSpanSlots = (booking: CalendarBooking): number => {
    // Always use 120 minutes (2 hours) = 4 slots of 30 minutes each
    return 4;
  };

  // Calculate the end time of a booking
  const getBookingEndTime = (booking: CalendarBooking): string => {
    const startTime = booking.booking_time.substring(0, 5);
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;
    
    // Always use 120 minutes (2 hours) for all bookings
    const duration = 120;
    const endMinutes = startMinutes + duration;
    
    const endHour = Math.floor(endMinutes / 60);
    const endMinute = endMinutes % 60;
    
    return `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
  };

  const goToPreviousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get all professionals (not just those with bookings)
  const getActiveProfessionals = () => {
    return professionals;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30";
      case "completed":
        return "bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30";
      case "cancelled":
        return "bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500/30";
      default:
        return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30";
    }
  };

  const timeSlots = getTimeSlots();
  const activeProfessionals = getActiveProfessionals();
  const isToday = currentDate.toDateString() === new Date().toDateString();

  // Scroll synchronization handlers
  const handleHeaderScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (gridScrollRef.current) {
      gridScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  const handleGridScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (headerScrollRef.current) {
      headerScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header - Compact Date Selector */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button onClick={goToPreviousDay} variant="ghost" size="sm" className="h-8 w-8 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-md cursor-pointer hover:bg-muted/80">
                <span className="font-semibold text-base">
                  {currentDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
                <ChevronRight className="h-4 w-4 rotate-90" />
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={currentDate}
                onSelect={(date) => {
                  if (date) {
                    setCurrentDate(date);
                    setIsCalendarOpen(false);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button onClick={goToNextDay} variant="ghost" size="sm" className="h-8 w-8 p-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button onClick={goToToday} variant="outline" size="sm">
          Today
        </Button>
      </div>



      {/* Professional Names Row - Outside table, synced scroll */}
      {activeProfessionals.length > 0 && (
        <div 
          ref={headerScrollRef}
          className="overflow-x-auto mb-0 scrollbar-hide"
          onScroll={handleHeaderScroll}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="min-w-[800px]">
            <div className={`grid`} style={{ gridTemplateColumns: `80px repeat(${activeProfessionals.length}, minmax(200px, 1fr))` }}>
              <div className="p-2">
                {/* Empty space above time column */}
              </div>
              {activeProfessionals.map((prof) => {
                const firstLetter = prof.name.trim()[0].toUpperCase();
                return (
                  <div 
                    key={prof.id} 
                    className="px-3 py-3 flex flex-col items-center justify-center gap-2"
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 border-2 border-blue-300 flex items-center justify-center text-lg font-bold">
                      {firstLetter}
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {prof.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      <Card className="overflow-hidden border-2 shadow-lg">
        <CardContent className="p-0">
          <div 
            ref={gridScrollRef}
            className="overflow-x-auto"
            onScroll={handleGridScroll}
          >
            <div className="min-w-[800px]">
              {/* Time Slots */}
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">
                  Loading bookings...
                </div>
              ) : professionals.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No professionals available
                </div>
              ) : (
                <div className="relative">
                  {timeSlots.map((time) => (
                    <div key={time} className="grid min-h-[70px]" style={{ gridTemplateColumns: `80px repeat(${activeProfessionals.length}, minmax(200px, 1fr))` }}>
                      <div className="p-2 border-r-2 border-b border-gray-300 dark:border-gray-600 text-xs text-muted-foreground font-medium bg-muted/10 flex items-start">
                        <span>{time.replace(':00', ':00\nam').replace(':30', ':30\nam')}</span>
                      </div>
                      {activeProfessionals.map((prof) => {
                        const professionalBookings = bookings.filter(b => 
                          b.professional_id === prof.id && 
                          b.booking_time.substring(0, 5) === time
                        );
                        
                        return (
                          <div 
                            key={prof.id} 
                            className="px-2 py-1 border-r border-b border-gray-200 dark:border-gray-700 relative"
                          >
                            {professionalBookings.map((booking) => {
                              const spanSlots = getBookingSpanSlots(booking);
                              const heightInPixels = spanSlots * 70 - 8; // 70px per slot minus padding
                              
                              return (
                                <div
                                  key={booking.id}
                                  className={`text-xs p-3 rounded-md mb-1 cursor-pointer hover:opacity-80 transition-all border ${getStatusColor(booking.status)} shadow-sm hover:shadow-md absolute left-2 right-2 z-10`}
                                  style={{ height: `${heightInPixels}px` }}
                                  title={`${booking.service_name} - ${booking.customer_name} (${booking.status})`}
                                >
                                  <div className="font-bold truncate text-base mb-1">
                                    {booking.booking_time.substring(0, 5)} - {getBookingEndTime(booking)}
                                  </div>
                                  <div className="truncate text-sm opacity-90">
                                    {booking.professional_name}
                                  </div>
                                  <div className="truncate text-sm opacity-90">
                                    {booking.service_name}
                                  </div>
                                  <div className="truncate text-sm opacity-75 mt-1 flex items-center gap-1">
                                    <span>👤</span> {booking.customer_name}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 justify-center p-4 bg-muted/30 rounded-lg border">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-yellow-500/20 border-2 border-yellow-500/30"></div>
          <span className="text-sm font-medium">Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-blue-500/20 border-2 border-blue-500/30"></div>
          <span className="text-sm font-medium">Confirmed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-green-500/20 border-2 border-green-500/30"></div>
          <span className="text-sm font-medium">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-gray-500/20 border-2 border-gray-500/30"></div>
          <span className="text-sm font-medium">Cancelled</span>
        </div>
      </div>
    </div>
  );
};
