import { useState, useEffect, useRef } from "react";
import { supabase } from "./lib/supabase";
import catSilhouette from "./assets/pet-cat.png";
import dogSilhouette from "./assets/pet-dog.png";
import boneSilhouette from "./assets/pet-bone.png";
import fishSilhouette from "./assets/pet-fish.png";
import pawcareLogo from "./assets/pawcare-logo.png";
import {
  Home, Users, Calendar, Bell, ShoppingBag, MessageCircle, AlertTriangle,
  LayoutDashboard, Stethoscope, LogOut, Plus, Search, ChevronRight, ChevronLeft,
  X, Check, Clock, MapPin, Phone, Star, Trash2, Package, FileText, Send, Menu,
  Heart, Activity, Pill, ShieldCheck, DollarSign,
  ArrowRight, CalendarClock, Video, Building2,
  UserCircle2, Filter
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

/* ---------------------------------------------------------------
   DESIGN TOKENS
   bg (paper)      #F5F4EE
   surface         #FFFFFF
   primary (teal)  #1F4B43
   primary-dark    #14332D
   primary-tint    #E4ECE9
   accent (marigold) #E2A33B
   accent-tint     #FBEDD6
   ink             #23231F
   muted           #746F63
   line            #E4E1D6
   alert           #C65D3B
   alert-tint      #F5E3DB
---------------------------------------------------------------- */

const AVATAR_COLORS = ["#1F4B43", "#E2A33B", "#C65D3B", "#6B8F87", "#B98A3E", "#8E6E9A"];

function initials(name) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}
function colorFor(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = seed.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

/* ---------------------------------------------------------------
   LIVE DATA

   Application records are loaded from Supabase. The remaining constants
   below are UI options (not sample records).
---------------------------------------------------------------- */

const availabilityTimeOptions = ["09:00 AM", "10:30 AM", "12:00 PM", "02:30 PM", "04:00 PM", "05:30 PM"];

function slotTimeToMinutes(slot) {
  const value = String(slot || "").trim();
  const twelveHour = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (twelveHour) {
    let hour = Number(twelveHour[1]);
    const minute = Number(twelveHour[2]);
    const period = twelveHour[3].toUpperCase();
    if (hour === 12) hour = 0;
    if (period === "PM") hour += 12;
    return hour * 60 + minute;
  }
  const twentyFourHour = value.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (twentyFourHour) return Number(twentyFourHour[1]) * 60 + Number(twentyFourHour[2]);
  return Number.MAX_SAFE_INTEGER;
}

function sortSlots(slots) {
  return [...(slots || [])].sort((a, b) => {
    const difference = slotTimeToMinutes(a) - slotTimeToMinutes(b);
    return difference !== 0 ? difference : String(a).localeCompare(String(b));
  });
}

const availabilityWeekdays = [
  { value: 0, label: "Sunday", short: "Sun" }, { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" }, { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" }, { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
];
const nextDays = Array.from({ length: 5 }).map((_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i + 1);
  return d;
});

const productCategories = ["All", "Food", "Toys", "Grooming", "Accessories", "Medicine"];

function fmtDate(d) {
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

/* ---------------------------------------------------------------
   SMALL UI PRIMITIVES
---------------------------------------------------------------- */

function Avatar({ label, size = 40, color }) {
  const c = color || colorFor(label);
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%", background: c, color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 600, fontSize: size * 0.38, flexShrink: 0, fontFamily: "Inter, sans-serif",
      }}
    >
      {initials(label)}
    </div>
  );
}

function Badge({ children, tone = "default" }) {
  const tones = {
    default: { bg: "var(--line)", color: "var(--muted)" },
    primary: { bg: "var(--primary-tint)", color: "var(--primary)" },
    accent: { bg: "var(--accent-tint)", color: "#8A5A16" },
    alert: { bg: "var(--alert-tint)", color: "var(--alert)" },
    success: { bg: "#E1EEE7", color: "#1F4B43" },
  };
  const t = tones[tone];
  return (
    <span style={{
      background: t.bg, color: t.color, fontSize: 12.5, fontWeight: 600,
      padding: "3px 10px", borderRadius: 999, display: "inline-block", whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}

function Btn({ children, onClick, variant = "primary", size = "md", icon: Icon, style, type = "button", disabled }) {
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    fontWeight: 600, borderRadius: 10, cursor: disabled ? "not-allowed" : "pointer",
    border: "1px solid transparent", transition: "opacity .15s, transform .1s",
    fontFamily: "Inter, sans-serif", opacity: disabled ? 0.5 : 1,
  };
  const sizes = { sm: { padding: "7px 12px", fontSize: 13.5 }, md: { padding: "10px 16px", fontSize: 14.5 }, lg: { padding: "13px 22px", fontSize: 15.5 } };
  const variants = {
    primary: { background: "var(--primary)", color: "#fff" },
    accent: { background: "var(--accent)", color: "#3A2A0C" },
    outline: { background: "transparent", color: "var(--primary)", border: "1px solid var(--primary)" },
    ghost: { background: "transparent", color: "var(--ink)" },
    danger: { background: "transparent", color: "var(--alert)", border: "1px solid var(--alert-tint)" },
    subtle: { background: "var(--line)", color: "var(--ink)" },
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseDown={(e) => { if (!disabled) e.currentTarget.style.transform = "scale(0.97)"; }}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
    >
      {Icon && <Icon size={size === "sm" ? 15 : 17} />}
      {children}
    </button>
  );
}

function Panel({ children, style, noPad }) {
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14,
      padding: noPad ? 0 : 20, ...style,
    }}>
      {children}
    </div>
  );
}

function PageHeader({ eyebrow, title, subtitle, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 14, marginBottom: 24 }}>
      <div>
        {eyebrow && <div style={{ color: "var(--muted)", fontSize: 13.5, marginBottom: 4 }}>{eyebrow}</div>}
        <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 30, fontWeight: 600, color: "var(--ink)", margin: 0, letterSpacing: "-0.01em" }}>{title}</h1>
        {subtitle && <p style={{ color: "var(--muted)", marginTop: 6, fontSize: 15, maxWidth: 560 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function Modal({ title, onClose, children, width = 480 }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(20,18,14,0.45)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16,
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 16, width: "100%", maxWidth: width,
          maxHeight: "88vh", overflowY: "auto", padding: 24, boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ fontFamily: "Fraunces, serif", fontSize: 21, margin: 0, fontWeight: 600 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "var(--line)", border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid var(--line)",
  fontSize: 14.5, fontFamily: "Inter, sans-serif", background: "#fff", boxSizing: "border-box", color: "var(--ink)",
};

/* ---------------------------------------------------------------
   NAV CONFIG
---------------------------------------------------------------- */

const NAV = {
  owner: [
    { id: "owner-home", label: "Overview", icon: Home },
    { id: "owner-pets", label: "My Pets", icon: Heart },
    { id: "owner-vets", label: "Find a Vet", icon: Stethoscope },
    { id: "owner-appointments", label: "Appointments", icon: Calendar },
    { id: "owner-reminders", label: "Reminders", icon: Bell },
    { id: "owner-shop", label: "Shop", icon: ShoppingBag },
    { id: "owner-ai", label: "AI Assistant", icon: MessageCircle },
    { id: "owner-emergency", label: "Emergency", icon: AlertTriangle },
  ],
  vet: [
    { id: "vet-home", label: "Overview", icon: LayoutDashboard },
    { id: "vet-availability", label: "My Slots", icon: Clock },
    { id: "vet-appointments", label: "Appointments", icon: CalendarClock },
    { id: "vet-patients", label: "Patients", icon: Users },
    { id: "vet-profile", label: "My Profile", icon: UserCircle2 },
  ],
  admin: [
    { id: "admin-home", label: "Overview", icon: LayoutDashboard },
    { id: "admin-users", label: "Users", icon: Users },
    { id: "admin-vets", label: "Veterinarians", icon: Stethoscope },
    { id: "admin-appointments", label: "Appointments", icon: Calendar },
    { id: "admin-products", label: "Products & Orders", icon: Package },
    { id: "admin-reviews", label: "Reviews", icon: Star },
    { id: "admin-admins", label: "Admins", icon: ShieldCheck },
  ],
};

/* ---------------------------------------------------------------
   ROUTING
---------------------------------------------------------------- */

const PAGE_PATHS = {
  "owner-home": "/owner/dashboard",
  "owner-pets": "/owner/pets",
  "owner-vets": "/owner/vets",
  "owner-appointments": "/owner/appointments",
  "owner-reminders": "/owner/reminders",
  "owner-shop": "/owner/shop",
  "owner-cart": "/owner/cart",
  "owner-orders": "/owner/orders",
  "owner-ai": "/owner/ai-assistant",
  "owner-emergency": "/owner/emergency",
  "vet-home": "/vet/dashboard",
  "vet-availability": "/vet/availability",
  "vet-appointments": "/vet/appointments",
  "vet-patients": "/vet/patients",
  "vet-profile": "/vet/profile",
  "admin-home": "/admin/dashboard",
  "admin-users": "/admin/users",
  "admin-vets": "/admin/veterinarians",
  "admin-appointments": "/admin/appointments",
  "admin-products": "/admin/products-orders",
  "admin-reviews": "/admin/reviews",
  "admin-admins": "/admin/admins",
};

const PATH_TO_PAGE = Object.fromEntries(
  Object.entries(PAGE_PATHS).map(([page, path]) => [path, page])
);

function pageFromPath(pathname) {
  return PATH_TO_PAGE[pathname] || null;
}

function roleForPage(page) {
  return page ? page.split("-")[0] : null;
}

/* ---------------------------------------------------------------
   APPOINTMENT TIME / STATUS HELPERS
---------------------------------------------------------------- */

const APPOINTMENT_BUFFER_MINUTES = 30;

function parseAppointmentDateTime(appointment) {
  if (!appointment?.appointment_date || !appointment?.appointment_time) return null;

  const date = String(appointment.appointment_date).slice(0, 10);
  const rawTime = String(appointment.appointment_time).trim();
  let hours;
  let minutes;
  let seconds;

  const ampmMatch = rawTime.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (ampmMatch) {
    hours = Number(ampmMatch[1]);
    minutes = Number(ampmMatch[2]);
    seconds = Number(ampmMatch[3] || 0);
    const meridiem = ampmMatch[4].toUpperCase();
    if (meridiem === "PM" && hours !== 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;
  } else {
    const timeMatch = rawTime.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (!timeMatch) return null;
    hours = Number(timeMatch[1]);
    minutes = Number(timeMatch[2]);
    seconds = Number(timeMatch[3] || 0);
  }

  const [year, month, day] = date.split("-").map(Number);
  const start = new Date(year, month - 1, day, hours, minutes, seconds, 0);
  return Number.isNaN(start.getTime()) ? null : start;
}

function getAppointmentState(appointment, now = new Date()) {
  if (!appointment) return "upcoming";

  // Only terminal/actively-running statuses should override the clock.
  // `upcoming` and `passed` are time-derived states, so a stale database
  // value cannot make an appointment remain in Upcoming forever.
  const persistedStatus = String(appointment.status || "upcoming").trim().toLowerCase();
  if (["completed", "not_held", "in_process", "cancelled"].includes(persistedStatus)) {
    return persistedStatus;
  }

  const start = parseAppointmentDateTime({
    appointment_date: appointment.appointmentDate || appointment.rawDate || appointment.appointment_date,
    appointment_time: appointment.time || appointment.appointment_time,
  });
  if (!start) return persistedStatus || "upcoming";

  const bufferEnd = new Date(start.getTime() + APPOINTMENT_BUFFER_MINUTES * 60 * 1000);
  if (now < start) return "upcoming";
  if (now < bufferEnd) return "passed";
  return "not_held";
}

function appointmentStatusLabel(status) {
  const labels = {
    upcoming: "Upcoming",
    passed: "Passed",
    in_process: "In Process",
    completed: "Completed",
    not_held: "Not Held",
    cancelled: "Cancelled",
  };
  return labels[status] || String(status || "Upcoming").replace(/_/g, " ");
}

function appointmentIsUpcoming(appointment, now = new Date()) {
  return getAppointmentState(appointment, now) === "upcoming";
}

/* ---------------------------------------------------------------
   ROOT APP
---------------------------------------------------------------- */

export default function App() {
  const [role, setRole] = useState(null); // null | 'owner' | 'vet' | 'admin'
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(() => pageFromPath(window.location.pathname) || "owner-home");
  const [authMode, setAuthMode] = useState(() => window.location.pathname === "/register" ? "register" : window.location.pathname === "/" ? "landing" : "login");
  const [sessionReady, setSessionReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [vets, setVets] = useState([]);
  const [vetAvailability, setVetAvailability] = useState({});
  const [products, setProducts] = useState([]);
  const [adminUsersData, setAdminUsersData] = useState([]);
  const [emergencyClinics, setEmergencyClinics] = useState([]);
  const [reviews, setReviews] = useState([]);

  const [addVetOpen, setAddVetOpen] = useState(false);
  const [addProductOpen, setAddProductOpen] = useState(false);

  const [pets, setPets] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [chat, setChat] = useState([
    { role: "ai", text: "Hi! I'm your AI pet-care assistant. Tell me what's going on with your pet, or ask about food, exercise, or grooming." },
  ]);

  const [addPetOpen, setAddPetOpen] = useState(false);
  const [petDetail, setPetDetail] = useState(null);
  const [bookingVet, setBookingVet] = useState(null);
  const [rescheduleAppt, setRescheduleAppt] = useState(null);

  function navigateTo(path, { replace = false } = {}) {
    const nextPath = path || "/";
    if (window.location.pathname !== nextPath) {
      if (replace) window.history.replaceState({}, "", nextPath);
      else window.history.pushState({}, "", nextPath);
    }
  }

  function goToPage(nextPage) {
    if (!PAGE_PATHS[nextPage]) return;
    setPage(nextPage);
    navigateTo(PAGE_PATHS[nextPage]);
  }

  function goToAuth(mode) {
    if (mode === "landing") {
      setAuthMode("landing");
      navigateTo("/");
      return;
    }

    const nextMode = mode === "register" ? "register" : "login";
    setAuthMode(nextMode);
    navigateTo(nextMode === "register" ? "/register" : "/login");
  }

  useEffect(() => {
    const handlePopState = () => {
      const pathPage = pageFromPath(window.location.pathname);
      if (pathPage) {
        setPage(pathPage);
      } else if (window.location.pathname === "/register") {
        setAuthMode("register");
      } else if (window.location.pathname === "/login") {
        setAuthMode("login");
      } else {
        setAuthMode("landing");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (!session?.user) {
        setRole(null);
        setUserId(null);
        setUserName("");
        if (window.location.pathname !== "/" && window.location.pathname !== "/login" && window.location.pathname !== "/register") {
          navigateTo("/login", { replace: true });
          setAuthMode("login");
        } else {
          setAuthMode(window.location.pathname === "/register" ? "register" : window.location.pathname === "/" ? "landing" : "login");
        }
        setSessionReady(true);
        return;
      }

      const { data: rawProfile, error: profileLoadError } = await supabase
        .from("profiles")
        .select("id, name, email, role")
        .eq("id", session.user.id)
        .single();

      if (!mounted) return;

      if (profileLoadError || !rawProfile) {
        console.error("Error loading profile:", profileLoadError);
        await supabase.auth.signOut();
        navigateTo("/login", { replace: true });
        setAuthMode("login");
        setSessionReady(true);
        return;
      }

      const profile = await syncProfileWithAuthMetadata(session.user, rawProfile);
      await ensureVetListing(session.user, profile);

      if (!mounted) return;

      setRole(profile.role);
      setUserName(profile.name || profile.email || "");
      setUserId(session.user.id);

      const requestedPage = pageFromPath(window.location.pathname);
      if (requestedPage && roleForPage(requestedPage) === profile.role) {
        setPage(requestedPage);
      } else {
        const dashboardPage = profile.role + "-home";
        setPage(dashboardPage);
        navigateTo(PAGE_PATHS[dashboardPage], { replace: true });
      }

      setSessionReady(true);

      await loadPets(profile.role);
      await loadAdminUsers();
      await loadVets();
      await loadVetAvailability();
      await loadAppointments(profile.role);
      await loadProducts();
      await loadOrders(profile.role);
      await loadReminders();
      await loadNotifications(session.user.id);
      await loadEmergencyClinics();
      await loadReviews();
    }

    loadSession();

    return () => {
      mounted = false;
    };
  }, []);

  // Re-check appointment windows while the app is open. This makes the
  // 30-minute buffer transition automatic without requiring a page refresh.
  useEffect(() => {
    if (!sessionReady || !role) return undefined;
    const timer = window.setInterval(() => {
      loadAppointments(role);
    }, 30000);
    return () => window.clearInterval(timer);
  }, [sessionReady, role]);

  // Live notifications: subscribe to Supabase Realtime for this user's
  // notification rows so new ones (and read-state changes from other tabs)
  // show up immediately, without needing a refresh or re-fetch.
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((current) => {
            // Realtime can deliver an INSERT that is already present after a
            // refresh/login. Keep the list unique by notification id.
            if (current.some((n) => n.id === payload.new.id)) {
              return current;
            }
            return [payload.new, ...current].slice(0, 30);
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((current) =>
            current.map((n) => (n.id === payload.new.id ? payload.new : n))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  async function loadEmergencyClinics() {
    const { data, error } = await supabase
      .from("emergency_clinics")
      .select("id, name, address, distance, phone, open24")
      .order("name");

    if (error) {
      console.error("Error loading emergency clinics:", error);
      setEmergencyClinics([]);
      return;
    }

    setEmergencyClinics(data || []);
  }

  async function loadReviews() {
    const { data, error } = await supabase
      .from("reviews")
      .select("id, author_id, veterinarian_id, product_id, rating, text, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading reviews:", error);
      setReviews([]);
      return;
    }

    const authorIds = [...new Set((data || []).map((review) => review.author_id).filter(Boolean))];
    const vetIds = [...new Set((data || []).map((review) => review.veterinarian_id).filter(Boolean))];
    const productIds = [...new Set((data || []).map((review) => review.product_id).filter(Boolean))];

    const [{ data: authors }, { data: reviewVets }, { data: reviewProducts }] = await Promise.all([
      authorIds.length ? supabase.from("profiles").select("id, name, email").in("id", authorIds) : Promise.resolve({ data: [] }),
      vetIds.length ? supabase.from("veterinarians").select("id, name, profiles(name)").in("id", vetIds) : Promise.resolve({ data: [] }),
      productIds.length ? supabase.from("products").select("id, name").in("id", productIds) : Promise.resolve({ data: [] }),
    ]);

    const authorMap = Object.fromEntries((authors || []).map((a) => [a.id, a.name || a.email || "User"]));
    const vetMap = Object.fromEntries((reviewVets || []).map((v) => [v.id, v.name || v.profiles?.name || "Veterinarian"]));
    const productMap = Object.fromEntries((reviewProducts || []).map((product) => [product.id, product.name]));

    setReviews((data || []).map((review) => ({
      id: review.id,
      author: authorMap[review.author_id] || "User",
      target: review.target_type === "vet" ? vetMap[review.target_id] || "Veterinarian" : productMap[review.target_id] || "Product",
      rating: Number(review.rating || 0),
      text: review.text || "",
      createdAt: review.created_at,
    })));
  }

  async function loadOrders(currentRole) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    let query = supabase
      .from("orders")
      .select(`
      id,
      order_number,
      owner_id,
      total,
      status,
      created_at,
      order_items (
        id,
        product_id,
        quantity
      )
    `)
      .order("created_at", { ascending: false });

    if (currentRole === "owner") {
      query = query.eq("owner_id", user.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error loading orders:", error);
      return;
    }

    const ownerIds = [...new Set((data || []).map((order) => order.owner_id).filter(Boolean))];
    let ownerNames = {};

    if (currentRole === "admin" && ownerIds.length > 0) {
      const { data: ownerProfiles, error: ownerProfilesError } = await supabase
        .from("profiles")
        .select("id, name, email")
        .in("id", ownerIds);

      if (ownerProfilesError) {
        console.error("Error loading order customer profiles:", ownerProfilesError);
      } else {
        ownerNames = Object.fromEntries(
          (ownerProfiles || []).map((profile) => [
            profile.id,
            profile.name || profile.email || "Customer",
          ])
        );
      }
    }

    const formattedOrders = (data || []).map((order) => ({
      id: order.id,
      orderNumber: order.order_number || `ORD${order.id}`,
      customer: currentRole === "admin"
        ? ownerNames[order.owner_id] || "Customer"
        : "You",
      items: (order.order_items || []).reduce(
        (sum, item) => sum + item.quantity,
        0
      ),
      total: Number(order.total),
      status: order.status,
      date: fmtDate(new Date(order.created_at)),
      createdAt: order.created_at,
      products: (order.order_items || []).map((item) => {
        const product = products.find((p) => String(p.id) === String(item.product_id));
        return {
          productId: item.product_id,
          qty: item.quantity,
          name: product?.name || "Product",
          price: Number(product?.price || 0),
        };
      }),
    }));

    setOrders(formattedOrders);
  }

  async function loadReminders() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("reminders")
      .select(`
      id,
      pet_id,
      type,
      due_date,
      tag,
      completed,
      pets (
        name
      )
    `)
      .eq("owner_id", user.id)
      .eq("completed", false)
      .order("due_date", { ascending: true });

    if (error) {
      console.error("Error loading reminders:", error);
      return;
    }

    setReminders(
      (data || []).map((reminder) => ({
        id: reminder.id,
        petId: reminder.pet_id,
        petName: reminder.pets?.name || "Pet",
        type: reminder.type,
        due: reminder.due_date
          ? fmtDate(new Date(reminder.due_date + "T00:00:00"))
          : "Upcoming",
        tag: reminder.tag,
      }))
    );
  }

  // Product IDs in the current Supabase schema are TEXT (for example pr1).
  // Keep them as strings throughout the app so they can be stored directly in
  // order_items.product_id without bigint/text conversion errors.
  function normalizeProductId(productId, availableProducts = products) {
    const textId = String(productId ?? "").trim();
    if (!textId) return null;

    const exactProduct = availableProducts.find(
      (p) => String(p.id ?? "").trim() === textId
    );
    if (exactProduct) return String(exactProduct.id).trim();

    // Legacy cart IDs such as pr1/pr2 are resolved against the currently
    // loaded product list when an exact database ID is not found.
    const legacyMatch = textId.match(/^pr(\d+)$/i);
    if (legacyMatch) {
      const index = Number(legacyMatch[1]) - 1;
      const legacyProduct = availableProducts[index];
      return legacyProduct?.id != null ? String(legacyProduct.id).trim() : null;
    }

    return null;
  }

  async function loadProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, category, price, rating")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading products:", error);
      return;
    }

    // IMPORTANT: products.id is TEXT in the database. Do not convert it to
    // Number/BigInt because existing IDs such as pr1 are valid product IDs.
    const loadedProducts = (data || []).map((product) => ({
      ...product,
      id: String(product.id ?? "").trim(),
      price: Number(product.price),
      rating: Number(product.rating || 0),
    })).filter((product) => product.id);

    setProducts(loadedProducts);

    // Repair any cart entries left over from an older version.
    setCart((currentCart) => {
      let changed = false;
      const migrated = currentCart
        .map((item) => {
          const normalizedId = normalizeProductId(item.productId, loadedProducts);
          if (normalizedId === null) return null;
          if (normalizedId !== String(item.productId ?? "").trim()) changed = true;
          return { ...item, productId: normalizedId };
        })
        .filter(Boolean);

      return changed || migrated.length !== currentCart.length
        ? migrated
        : currentCart;
    });
  }

  async function loadPets(currentRole) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    let query = supabase
      .from("pets")
      .select(`
      id,
      owner_id,
      name,
      species,
      breed,
      age,
      weight,
      gender,
      vaccinations (
        id,
        name,
        vaccination_date,
        status
      ),
      medical_records (
        id,
        record_date,
        note,
        veterinarians (
          profiles (
            name
          )
        )
      ),
      prescriptions (
        id,
        medicine,
        dosage,
        frequency,
        duration,
        instructions,
        prescription_date,
        vet_id,
        veterinarians (
          id,
          profiles (
            name
          )
        )
      )
    `)
      .order("created_at", { ascending: false });

    // Owners only see their own pets. Admins see everything. Vets only see
    // pets that have actually booked an appointment with them — resolved by
    // first finding which pet_ids appear in their own appointments.
    if (currentRole === "owner") {
      query = query.eq("owner_id", user.id);
    } else if (currentRole === "vet") {
      const myVetId = await getMyVetRowId(user.id);
      if (!myVetId) {
        setPets([]);
        return;
      }

      const { data: apptRows, error: apptError } = await supabase
        .from("appointments")
        .select("pet_id")
        .eq("vet_id", myVetId);

      if (apptError) {
        console.error("Error loading patient list:", apptError);
        setPets([]);
        return;
      }

      const petIds = [...new Set((apptRows || []).map((a) => a.pet_id))];
      if (petIds.length === 0) {
        setPets([]);
        return;
      }

      query = query.in("id", petIds);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error loading pets:", error);
      return;
    }

    const formattedPets = (data || []).map((pet) => ({
      id: pet.id,
      name: pet.name,
      species: pet.species,
      breed: pet.breed || "",
      age: pet.age || "",
      weight: pet.weight || "",
      gender: pet.gender || "",
      vaccinations: (pet.vaccinations || []).map((v) => ({
        id: v.id,
        name: v.name,
        date: v.vaccination_date,
        status: v.status,
      })),
      medical: (pet.medical_records || []).map((record) => ({
        id: record.id,
        date: record.record_date,
        note: record.note,
        vet: record.veterinarians?.profiles?.name || "Veterinarian",
      })),
      prescriptions: (pet.prescriptions || []).map((prescription) => ({
        id: prescription.id,
        medicine: prescription.medicine,
        dosage: prescription.dosage,
        frequency: prescription.frequency,
        duration: prescription.duration,
        instructions: prescription.instructions || "",
        date: prescription.prescription_date,
        vet: prescription.veterinarians?.profiles?.name || "Veterinarian",
      })),
    }));

    setPets(formattedPets);
  }

  async function loadAdminUsers() {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, name, email, role, created_at")
      .order("created_at", { ascending: false });

    if (profilesError) {
      console.error("Error loading admin user list:", profilesError);
      return;
    }

    const ownerIds = (profiles || []).filter((p) => p.role === "owner").map((p) => p.id);
    let petCounts = {};

    if (ownerIds.length) {
      const { data: petsForOwners, error: petCountError } = await supabase
        .from("pets")
        .select("owner_id")
        .in("owner_id", ownerIds);

      if (petCountError) {
        console.error("Error loading user pet counts:", petCountError);
      } else {
        petCounts = (petsForOwners || []).reduce((counts, pet) => {
          counts[pet.owner_id] = (counts[pet.owner_id] || 0) + 1;
          return counts;
        }, {});
      }
    }

    const { data: admins, error: adminError } = await supabase
      .from("admin")
      .select("profile_id");

    if (adminError) {
      console.error("Error loading admin records:", adminError);
    }

    const adminIds = new Set((admins || []).map((a) => a.profile_id));

    setAdminUsersData((profiles || []).map((profile) => ({
      id: profile.id,
      name: profile.name || profile.email || "User",
      email: profile.email || "",
      role: adminIds.has(profile.id) ? "admin" : profile.role,
      pets: petCounts[profile.id] || 0,
      joined: profile.created_at ? fmtDate(new Date(profile.created_at)) : "—",
    })));
  }

  async function loadVets() {
    // Do not join `profiles` here. Pet owners are restricted from reading
    // other users' profile rows by RLS, so the nested relation can be empty
    // even when a valid veterinarian exists. The veterinarians table is the
    // directory source for this page; role synchronization removes stale
    // veterinarian rows when an account changes role.
    const { data, error } = await supabase
      .from("veterinarians")
      .select(`
      id,
      profile_id,
      name,
      specialty,
      rating,
      experience,
      location,
      fee,
      online,
      in_person
    `)
      .order("id");

    if (error) {
      console.error("Error loading veterinarians:", error);
      return;
    }

    // Use the veterinarian listing directly. Filtering through profiles
    // would hide valid vets for owners because of profiles RLS.
    const formattedVets = (data || []).map((vet) => ({
        id: vet.id,
        profileId: vet.profile_id,
        name: vet.name || "Veterinarian",
        specialty: vet.specialty,
        rating: Number(vet.rating || 0),
        experience: vet.experience,
        location: vet.location,
        fee: Number(vet.fee || 0),
        online: vet.online,
        inPerson: vet.in_person,
      }));

    setVets(formattedVets);
  }

  // Resolves the `veterinarians.id` row for the currently logged-in vet
  // (keyed via `profile_id`). Returns null if they don't have a listing yet.
  async function getMyVetRowId(authUserId) {
    const { data, error } = await supabase
      .from("veterinarians")
      .select("id")
      .eq("profile_id", authUserId)
      .maybeSingle();

    if (error) {
      console.error("Error looking up veterinarian listing:", error);
      return null;
    }

    return data?.id ?? null;
  }

  async function loadVetAvailability() {
    const { data, error } = await supabase.from("vet_availability").select("vet_id, day_of_week, slot_time").order("day_of_week").order("slot_time");
    if (error) { console.error("Error loading veterinarian availability:", error); return; }
    const grouped = {};
    (data || []).forEach((row) => {
      if (!grouped[row.vet_id]) grouped[row.vet_id] = {};
      if (!grouped[row.vet_id][row.day_of_week]) grouped[row.vet_id][row.day_of_week] = [];
      grouped[row.vet_id][row.day_of_week].push(row.slot_time);
    });
    Object.values(grouped).forEach((days) => {
      Object.keys(days).forEach((day) => {
        days[day] = sortSlots(days[day]);
      });
    });
    setVetAvailability(grouped);
  }

  async function loadAppointments(currentRole) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    let query = supabase
      .from("appointments")
      .select(`
      id,
      owner_id,
      pet_id,
      vet_id,
      appointment_date,
      appointment_time,
      mode,
      status,
      pets (
        name
      ),
      veterinarians (
        id,
        profiles (
          name
        )
      )
    `)
      .order("appointment_date", { ascending: true });

    if (currentRole === "owner") {
      query = query.eq("owner_id", user.id);
    } else if (currentRole === "vet") {
      const myVetId = await getMyVetRowId(user.id);
      if (!myVetId) {
        setAppointments([]);
        return;
      }
      query = query.eq("vet_id", myVetId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error loading appointments:", error);
      return;
    }

    const now = new Date();
    const autoNotHeldIds = (data || [])
      .filter((appointment) => {
        const state = getAppointmentState({
          ...appointment,
          appointmentDate: appointment.appointment_date,
          time: appointment.appointment_time,
        }, now);
        return state === "not_held" && !["completed", "not_held", "in_process", "cancelled"].includes(String(appointment.status || "").trim().toLowerCase());
      })
      .map((appointment) => appointment.id);

    if (autoNotHeldIds.length > 0) {
      const { error: autoUpdateError } = await supabase
        .from("appointments")
        .update({ status: "not_held" })
        .in("id", autoNotHeldIds);

      if (autoUpdateError) {
        // Even if RLS temporarily prevents the write, the UI derives the
        // correct Not Held state from the appointment time.
        console.error("Error automatically marking appointments as not held:", autoUpdateError);
      }

      (data || []).forEach((appointment) => {
        if (autoNotHeldIds.includes(appointment.id)) appointment.status = "not_held";
      });
    }

    const formattedAppointments = (data || []).map((appointment) => ({
      id: appointment.id,
      ownerId: appointment.owner_id,
      petId: appointment.pet_id,
      petName: appointment.pets?.name || "Unknown pet",
      vetId: appointment.vet_id,
      vetName: appointment.veterinarians?.profiles?.name || "Veterinarian",
      appointmentDate: appointment.appointment_date,
      date: fmtDate(new Date(appointment.appointment_date + "T00:00:00")),
      time: appointment.appointment_time,
      mode: appointment.mode,
      status: appointment.status,
    }));

    setAppointments(formattedAppointments);
  }

  // The database profile is authoritative for the account role.
  // Do not overwrite profiles.role from client-controlled auth metadata.
  async function syncProfileWithAuthMetadata(_authUser, profile) {
    return profile;
  }

  // Makes sure a vet always has a listing in the `veterinarians` table
  // (which is what "Find a Vet" reads from), even if it wasn't created at
  // signup — e.g. because email confirmation delayed the initial write.
  async function ensureVetListing(authUser, profile) {
    if (!authUser || !profile || profile.role !== "vet") {
      return;
    }

    const { data: existing, error: lookupError } = await supabase
      .from("veterinarians")
      .select("id")
      .eq("profile_id", authUser.id)
      .maybeSingle();

    if (lookupError) {
      console.error("Error checking veterinarian listing:", lookupError);
      return;
    }

    if (existing) {
      return;
    }

    const { error: vetError } = await supabase.from("veterinarians").insert({
      profile_id: authUser.id,
      name: profile.name,
      specialty: "",
      location: "",
      fee: 0,
      experience: "",
      online: true,
      in_person: true,
      rating: 0,
    });

    if (vetError) {
      console.error("Error creating veterinarian listing:", vetError);
    }
  }

  /* ---------------------------------------------------------------
     NOTIFICATIONS (live, backed by Supabase Realtime)
  ---------------------------------------------------------------- */

  async function loadNotifications(forUserId) {
    const targetId = forUserId || userId;
    if (!targetId) return;

    const { data, error } = await supabase
      .from("notifications")
      .select("id, title, body, read, created_at")
      .eq("user_id", targetId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      console.error("Error loading notifications:", error);
      return;
    }

    setNotifications(data || []);
  }

  async function createNotification(targetUserId, title, body) {
    if (!targetUserId) return;

    const { error } = await supabase.rpc("create_notification", {
      target_user_id: targetUserId,
      notification_title: title,
      notification_body: body,
    });

    if (error) {
      console.error("Error creating notification:", error);
    }
  }

  async function notifyAdmins(title, body) {
    const { data: admins, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "admin");

    if (error) {
      console.error("Error finding admins to notify:", error);
      return;
    }

    await Promise.all(
      (admins || []).map((admin) => createNotification(admin.id, title, body))
    );
  }

  async function markNotificationsRead() {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    // Update locally right away so the badge clears instantly; the
    // realtime UPDATE event will confirm/no-op when it arrives.
    setNotifications((current) => current.map((n) => ({ ...n, read: true })));

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .in("id", unreadIds);

    if (error) {
      console.error("Error marking notifications as read:", error);
    }
  }

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error("Login failed. Please try again.");
    }

    const { data: rawProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id, name, email, role")
      .eq("id", data.user.id)
      .single();

    if (profileError) {
      throw new Error("Your account profile could not be loaded.");
    }

    const profile = await syncProfileWithAuthMetadata(data.user, rawProfile);
    await ensureVetListing(data.user, profile);

    setRole(profile.role);
    setUserName(profile.name || profile.email || "");
    setUserId(data.user.id);
    setSidebarOpen(false);
    goToPage(profile.role + "-home");

    await loadPets(profile.role);
    await loadAdminUsers();
    await loadVets();
    await loadAppointments(profile.role);
    await loadProducts();
    await loadOrders(profile.role);
    await loadReminders();
    await loadNotifications(data.user.id);
    await loadEmergencyClinics();
    await loadReviews();
  }

  async function register(name, email, password, requestedRole) {
    const safeRole = requestedRole === "vet" ? "vet" : "owner";

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: safeRole,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error("Registration failed. Please try again.");
    }

    // If email confirmation is disabled, create/update the profile immediately.
    if (data.session) {
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: data.user.id,
            name,
            email,
            role: safeRole,
          },
          { onConflict: "id" }
        );

      if (profileError) {
        await supabase.auth.signOut();
        throw new Error(
          "Account was created, but the user profile could not be saved. " +
            profileError.message
        );
      }

      // Vets need to show up in "Find a Vet" for pet owners to book them.
      // That list comes from the `veterinarians` table, keyed to this
      // profile via `profile_id` — so create that row too, using
      // placeholder details the vet can fill in from their profile later.
      if (safeRole === "vet") {
        const { error: vetError } = await supabase
          .from("veterinarians")
          .upsert(
            {
              profile_id: data.user.id,
              name,
              specialty: "",
              location: "",
              fee: 0,
              experience: "",
              online: true,
              in_person: true,
              rating: 0,
            },
            { onConflict: "profile_id" }
          );

        if (vetError) {
          // Don't block the account from being created over this — just
          // surface it so it's easy to spot during testing.
          console.error("Error creating veterinarian listing:", vetError);
        }
      }

      setRole(safeRole);
      setUserName(name);
      setUserId(data.user.id);
      setSidebarOpen(false);
      goToPage(safeRole + "-home");
      await loadPets(safeRole);
      await loadAdminUsers();
      await loadVets();
      await loadVetAvailability();
      await loadAppointments(safeRole);
      await loadOrders(safeRole);
      await loadReminders();
      await loadProducts();
      await loadNotifications(data.user.id);
      await loadEmergencyClinics();
      await loadReviews();

      await notifyAdmins(
        "New user registered",
        `${name} joined Pawcare as ${safeRole === "vet" ? "a veterinarian" : "a pet owner"}.`
      );

      return;
    }

    // When email confirmation is enabled, the profile should be created by
    // the existing Supabase profile trigger using the role metadata above.
    alert(
      safeRole === "vet"
        ? "Veterinarian account created successfully. Please check your email to verify your account."
        : "Account created successfully. Please check your email to verify your account."
    );
    setAuthMode("login");
  }

  async function handleAuth(formData) {
    if (authMode === "login") {
      await login(formData.email, formData.password);
    } else {
      await register(
        formData.name,
        formData.email,
        formData.password,
        formData.role
      );
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    setRole(null);
    setUserName("");
    setUserId(null);
    setNotifications([]);
    setPets([]);
    setAppointments([]);
    setReminders([]);
    setVets([]);
    setProducts([]);
    setAdminUsersData([]);
    setEmergencyClinics([]);
    setReviews([]);
    setOrders([]);
    setCart([]);
    setChat([{ role: "ai", text: "Hi! I'm your Pawcare assistant. Ask me anything about your pet's health, nutrition, grooming, or care." }]);
    setPetDetail(null);
    setBookingVet(null);
    setRescheduleAppt(null);
    setAddPetOpen(false);
    setAddVetOpen(false);
    setAddProductOpen(false);
    goToAuth("login");
  }

  async function addPet(pet) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("You must be logged in to add a pet.");
      return;
    }

    const { data, error } = await supabase
      .from("pets")
      .insert({
        owner_id: user.id,
        name: pet.name,
        species: pet.species,
        breed: pet.breed || null,
        age: pet.age || null,
        weight: pet.weight || null,
        gender: pet.gender || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding pet:", error);
      alert(error.message);
      return;
    }

    setPets((currentPets) => [
      ...currentPets,
      {
        id: data.id,
        name: data.name,
        species: data.species,
        breed: data.breed || "",
        age: data.age || "",
        weight: data.weight || "",
        gender: data.gender || "",
        vaccinations: [],
        medical: [],
        prescriptions: [],
      },
    ]);

    setAddPetOpen(false);
  }

  async function bookAppointment({ vet, pet, date, time, mode }) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("You must be logged in to book an appointment.");
        return;
      }

      if (!pet) {
        alert("Please select a pet before booking.");
        return;
      }

      if (!time) {
        alert("Please choose a time slot before booking.");
        return;
      }

      const { data, error } = await supabase
        .from("appointments")
        .insert({
          owner_id: user.id,
          pet_id: pet.id,
          vet_id: vet.id,
          appointment_date: date,
          appointment_time: time,
          mode,
          status: "upcoming",
        })
        .select(`
        id,
        owner_id,
        pet_id,
        vet_id,
        appointment_date,
        appointment_time,
        mode,
        status
      `)
        .single();

      if (error) {
        console.error("Error booking appointment:", error);
        alert(
          "Could not book the appointment: " +
            (error.message || error.details || error.hint || JSON.stringify(error))
        );
        return;
      }

      const newAppointment = {
        id: data.id,
        petId: pet.id,
        petName: pet.name,
        vetId: vet.id,
        vetName: vet.name,
        date: fmtDate(
          new Date(data.appointment_date + "T00:00:00")
        ),
        time: data.appointment_time,
        mode: data.mode,
        status: data.status,
      };

      setAppointments((currentAppointments) => [
        newAppointment,
        ...currentAppointments,
      ]);

      if (vet.profileId) {
        await createNotification(
          vet.profileId,
          "New appointment booked",
          `${pet.name}'s owner booked a ${mode.toLowerCase()} appointment on ${newAppointment.date} at ${time}.`
        );
      }

      setBookingVet(null);
      goToPage("owner-appointments");
    } catch (err) {
      console.error("Unexpected error booking appointment:", err);
      alert("Something went wrong while booking: " + (err?.message || String(err)));
    }
  }
  async function cancelAppointment(id) {
    const { error } = await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", id);

    if (error) {
      console.error("Error cancelling appointment:", error);
      alert(error.message);
      return;
    }

    const appointment = appointments.find((a) => a.id === id);

    setAppointments((currentAppointments) =>
      currentAppointments.map((appointment) =>
        appointment.id === id
          ? { ...appointment, status: "cancelled" }
          : appointment
      )
    );

    const vet = vets.find((v) => v.id === appointment?.vetId);
    if (vet?.profileId) {
      await createNotification(
        vet.profileId,
        "Appointment cancelled",
        `${appointment.petName}'s owner cancelled their appointment on ${appointment.date}.`
      );
    }
  }
  async function updateApptStatus(id, status) {
    const { error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error("Error updating appointment status:", error);
      alert(error.message);
      return;
    }

    const appointment = appointments.find((a) => a.id === id);

    setAppointments((currentAppointments) =>
      currentAppointments.map((appointment) =>
        appointment.id === id
          ? { ...appointment, status }
          : appointment
      )
    );

    if (appointment?.ownerId) {
      const statusText = {
        upcoming: "confirmed",
        in_process: "started and is now in process",
        completed: "marked as completed",
        not_held: "marked as not held",
        cancelled: "cancelled",
      }[status] || status;

      await createNotification(
        appointment.ownerId,
        "Appointment update",
        `${appointment.petName}'s appointment on ${appointment.date} was ${statusText}.`
      );
    }
  }

  async function saveConsultationNote(petId, note) {
    if (!note.trim()) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("You must be logged in.");
      return;
    }

    const myVetId = await getMyVetRowId(user.id);
    if (!myVetId) {
      alert("Your veterinarian profile could not be found.");
      return;
    }

    const { data, error } = await supabase
      .from("medical_records")
      .insert({
        pet_id: petId,
        record_date: new Date().toISOString().split("T")[0],
        note: note.trim(),
        vet_id: myVetId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving medical record:", error);
      alert(error.message);
      return;
    }

    const newRecord = {
      id: data.id,
      date: data.record_date,
      note: data.note,
      vet: userName || "Veterinarian",
    };

    setPets((currentPets) =>
      currentPets.map((p) =>
        p.id === petId
          ? {
            ...p,
            medical: [...(p.medical || []), newRecord],
          }
          : p
      )
    );

    setPetDetail((currentPet) =>
      currentPet
        ? {
          ...currentPet,
          medical: [...(currentPet.medical || []), newRecord],
        }
        : currentPet
    );
  }

  async function addVaccination(petId, vaccination) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("You must be logged in.");
      return;
    }

    const { data, error } = await supabase
      .from("vaccinations")
      .insert({
        pet_id: petId,
        name: vaccination.name,
        vaccination_date: vaccination.date,
        status: vaccination.status,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding vaccination:", error);
      alert(error.message);
      return;
    }

    const newVaccination = {
      id: data.id,
      name: data.name,
      date: data.vaccination_date,
      status: data.status,
    };

    setPets((currentPets) =>
      currentPets.map((p) =>
        p.id === petId
          ? {
            ...p,
            vaccinations: [
              ...(p.vaccinations || []),
              newVaccination,
            ],
          }
          : p
      )
    );

    setPetDetail((currentPet) =>
      currentPet
        ? {
          ...currentPet,
          vaccinations: [
            ...(currentPet.vaccinations || []),
            newVaccination,
          ],
        }
        : currentPet
    );
  }

  async function addPrescription(petId, prescription) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("You must be logged in.");
      return;
    }

    const myVetId = await getMyVetRowId(user.id);
    if (!myVetId) {
      alert("Your veterinarian profile could not be found.");
      return;
    }

    const { data, error } = await supabase
      .from("prescriptions")
      .insert({
        pet_id: petId,
        vet_id: myVetId,
        medicine: prescription.medicine,
        dosage: prescription.dosage,
        frequency: prescription.frequency,
        duration: prescription.duration,
        instructions: prescription.instructions || "",
        prescription_date: new Date().toISOString().split("T")[0],
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding prescription:", error);
      alert(error.message);
      return;
    }

    const newPrescription = {
      id: data.id,
      medicine: data.medicine,
      dosage: data.dosage,
      frequency: data.frequency,
      duration: data.duration,
      instructions: data.instructions || "",
      date: data.prescription_date,
      vet: userName || "Veterinarian",
    };

    setPets((currentPets) =>
      currentPets.map((p) =>
        p.id === petId
          ? {
            ...p,
            prescriptions: [
              ...(p.prescriptions || []),
              newPrescription,
            ],
          }
          : p
      )
    );

    setPetDetail((currentPet) =>
      currentPet
        ? {
          ...currentPet,
          prescriptions: [
            ...(currentPet.prescriptions || []),
            newPrescription,
          ],
        }
        : currentPet
    );
  }

  async function markReminderDone(id) {
    const { error } = await supabase
      .from("reminders")
      .update({ completed: true })
      .eq("id", id);

    if (error) {
      console.error("Error completing reminder:", error);
      alert(error.message);
      return;
    }

    setReminders((currentReminders) =>
      currentReminders.filter((reminder) => reminder.id !== id)
    );
  }

  function addToCart(productId) {
    const normalizedId = normalizeProductId(productId, products);
    if (normalizedId === null) {
      console.error("Unable to resolve product ID:", productId, products);
      alert("This product could not be added because its database ID is unavailable. Please refresh the shop and try again.");
      return;
    }

    setCart((c) => {
      const existing = c.find((i) => String(i.productId) === normalizedId);
      if (existing) {
        return c.map((i) =>
          String(i.productId) === normalizedId
            ? { ...i, productId: normalizedId, qty: i.qty + 1 }
            : i
        );
      }
      return [...c, { productId: normalizedId, qty: 1 }];
    });
  }
  function orderAgain(order) {
    if (!order.products) return;

    setCart((currentCart) => {
      const updatedCart = [...currentCart];

      order.products.forEach((item) => {
        const existing = updatedCart.find(
          (cartItem) =>
            String(cartItem.productId) === String(item.productId)
        );

        if (existing) {
          existing.qty += item.qty;
        } else {
          updatedCart.push({
            productId: item.productId,
            qty: item.qty,
          });
        }
      });

      return updatedCart;
    });

    goToPage("owner-cart");
  }
  function changeQty(productId, delta) {
    setCart((c) =>
      c
        .map((i) =>
          String(i.productId) === String(productId)
            ? { ...i, qty: i.qty + delta }
            : i
        )
        .filter((i) => i.qty > 0)
    );
  }
  function removeFromCart(productId) {
    setCart((c) => c.filter((i) => String(i.productId) !== String(productId)));
  }
  async function placeOrder(total) {
    if (cart.length === 0) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("You must be logged in to place an order.");
      return;
    }

    // IMPORTANT:
    // `orders.id` is a BIGINT generated by PostgreSQL.
    // The human-readable value such as "ORD547376" belongs in
    // `orders.order_number`, not in the BIGINT `id` column.
    const orderNumber = `ORD${Date.now()}`;

    // Create the order first and let PostgreSQL generate its BIGINT id.
    const { data: createdOrder, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        owner_id: user.id,
        total,
        status: "Pending",
      })
      .select("id, order_number")
      .single();

    if (orderError || !createdOrder) {
      console.error("Error creating order:", orderError);
      alert(orderError?.message || "Unable to create the order.");
      return;
    }

    // order_items.order_id is also a BIGINT FK, so use the generated
    // numeric orders.id rather than the text order number.
    const orderItems = cart.map((item) => {
      const productId = normalizeProductId(item.productId);
      const product = products.find((p) => String(p.id) === String(productId));

      if (productId === null || !product) {
        return null;
      }

      return {
        order_id: createdOrder.id,
        product_id: productId,
        quantity: item.qty,
        // order_items.unit_price is NOT NULL in the Supabase schema.
        // Store the price at the time the order is placed so historical
        // orders remain accurate even if the product price changes later.
        unit_price: Number(product.price || 0),
      };
    }).filter(Boolean);

    if (orderItems.length !== cart.length) {
      await supabase.from("orders").delete().eq("id", createdOrder.id);
      alert("One or more products in your cart are no longer available. Please refresh the shop and add them again.");
      return;
    }

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Error creating order items:", itemsError);

      // Remove the order if its items could not be saved.
      await supabase
        .from("orders")
        .delete()
        .eq("id", createdOrder.id);

      alert(itemsError.message);
      return;
    }

    const newOrder = {
      id: createdOrder.id,
      orderNumber: createdOrder.order_number || orderNumber,
      customer: "You",
      items: cart.reduce(
        (sum, item) => sum + item.qty,
        0
      ),
      products: cart.map((item) => {
        const product = products.find(
          (p) => String(p.id) === String(item.productId)
        );

        return {
          productId: item.productId,
          qty: item.qty,
          name: product?.name || "Product",
          price: product?.price || 0,
        };
      }),
      total,
      status: "Pending",
      date: fmtDate(new Date()),
    };

    setOrders((currentOrders) => [
      newOrder,
      ...currentOrders,
    ]);

    setCart([]);
    goToPage("owner-orders");
  }

  function sendChat(text) {
    if (!text.trim()) return;
    setChat((c) => [...c, { role: "user", text }]);
    setTimeout(() => {
      setChat((c) => [...c, { role: "ai", text: aiReply(text) }]);
    }, 550);
  }

  if (!sessionReady) {
    return (
      <Shell>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: 14 }}>
          Loading Pawcare…
        </div>
      </Shell>
    );
  }

  if (!role) {
    return (
      <Shell>
        {authMode === "landing" ? (
          <Landing onStart={() => goToAuth("login")} />
        ) : (
          <AuthScreen mode={authMode} setMode={goToAuth} onAuth={handleAuth} />
        )}
      </Shell>
    );
  }

  return (
    <Shell>
      <div style={{ minHeight: "100vh" }}>
        <Sidebar role={role} userName={userName} page={page} setPage={goToPage} onLogout={logout} open={sidebarOpen} setOpen={setSidebarOpen} visible={sidebarVisible} onHide={() => { setSidebarVisible(false); setSidebarOpen(false); }} />
        <div style={{ minHeight: "100vh", marginLeft: sidebarVisible ? 240 : 0, transition: "margin-left 180ms ease" }}>
          <TopBar role={role} onMenu={() => { if (window.innerWidth <= 860) setSidebarOpen(true); else setSidebarVisible(true); }} sidebarVisible={sidebarVisible} cartCount={cart.reduce((s, i) => s + i.qty, 0)} onCart={() => goToPage("owner-cart")} notifications={notifications} onOpenNotifications={markNotificationsRead} />
          <main style={{ padding: "26px 28px 60px", maxWidth: 1160, margin: "0 auto" }}>
            {role === "owner" && page === "owner-home" && (
              <OwnerHome userName={userName} pets={pets} appointments={appointments} reminders={reminders} setPage={goToPage} setPetDetail={setPetDetail} />
            )}
            {role === "owner" && page === "owner-pets" && (
              <OwnerPets pets={pets} onAdd={() => setAddPetOpen(true)} onOpen={setPetDetail} />
            )}
            {role === "owner" && page === "owner-vets" && (
              <FindVets vets={vets} onBook={setBookingVet} />
            )}
            {role === "owner" && page === "owner-appointments" && (
              <OwnerAppointments appointments={appointments} onCancel={cancelAppointment} onReschedule={setRescheduleAppt} setPage={goToPage} />
            )}
            {role === "owner" && page === "owner-reminders" && (
              <OwnerReminders reminders={reminders} appointments={appointments} onMarkDone={markReminderDone} />
            )}
            {role === "owner" && page === "owner-shop" && (
              <Shop
                products={products}
                onAdd={addToCart}
                cartCount={cart.reduce((s, i) => s + i.qty, 0)}
                onCart={() => goToPage("owner-cart")}
                orders={orders}
                onOrderAgain={orderAgain}
              />
            )}
            {role === "owner" && page === "owner-cart" && (
              <CartPage cart={cart} products={products} onQty={changeQty} onRemove={removeFromCart} onCheckout={placeOrder} setPage={goToPage} />
            )}
            {role === "owner" && page === "owner-orders" && <OrdersPage orders={orders} setPage={goToPage} />}
            {role === "owner" && page === "owner-ai" && <AiAssistant chat={chat} onSend={sendChat} pets={pets} />}
            {role === "owner" && page === "owner-emergency" && <Emergency clinics={emergencyClinics} />}

            {role === "vet" && page === "vet-home" && (
              <VetHome
                appointments={appointments}
                pets={pets}
                vetName={userName}
                onOpenPatient={(id) => {
                  if (id != null) setPetDetail(pets.find((p) => p.id === id));
                }}
                onNavigate={goToPage}
              />
            )}
            {role === "vet" && page === "vet-availability" && (
              <VetAvailability onSaved={loadVetAvailability} />
            )}
            {role === "vet" && page === "vet-appointments" && (
              <VetAppointments
                appointments={appointments}
                pets={pets}
                vetName={userName}
                onUpdate={updateApptStatus}
                onOpenPatient={(id) => {
                  setPetDetail(pets.find((p) => p.id === id));
                }}
                onNavigate={goToPage}
              />
            )}
            {role === "vet" && page === "vet-patients" && <VetPatients pets={pets} appointments={appointments} onOpen={setPetDetail} />}
            {role === "vet" && page === "vet-profile" && <VetProfile onSaved={loadVets} />}

            {role === "admin" && page === "admin-home" && <AdminHome users={adminUsersData} vets={vets} orders={orders} appointments={appointments} />}
            {role === "admin" && page === "admin-users" && (
              <AdminUsers
                users={adminUsersData}
                onRoleChange={async (id, newRole) => {
                  const { error } = await supabase.rpc("admin_change_user_role", {
                    target_user_id: id,
                    new_role: newRole,
                  });
                  if (error) { alert(error.message); return; }
                  await loadAdminUsers();
                  await loadVets();
                }}
                onDelete={async (id) => {
                  if (!window.confirm("Delete this profile? This cannot be undone.")) return;
                  const { error } = await supabase.rpc("admin_delete_user", { target_user_id: id });
                  if (error) { alert(error.message); return; }
                  await loadAdminUsers();
                  await loadVets();
                  await loadAppointments("admin");
                  await loadOrders("admin");
                }}
              />
            )}
            {role === "admin" && page === "admin-vets" && (
              <AdminVets
                vets={vets}
                onAdd={() => setAddVetOpen(true)}
                onEdit={async (id, updates) => {
                  const { error } = await supabase.from("veterinarians").update(updates).eq("id", id);
                  if (error) { alert(error.message); return; }
                  await loadVets();
                }}
                onDelete={async (id) => {
                  if (!window.confirm("Remove this veterinarian listing?")) return;
                  const { error } = await supabase.from("veterinarians").delete().eq("id", id);
                  if (error) { alert(error.message); return; }
                  await loadVets();
                }}
              />
            )}
            {role === "admin" && page === "admin-appointments" && <AdminAppointments appointments={appointments} />}
            {role === "admin" && page === "admin-products" && (
              <AdminProducts
                products={products}
                orders={orders}
                onAdd={() => setAddProductOpen(true)}
                onUpdateOrder={async (id, status) => {
                  const { error } = await supabase.from("orders").update({ status }).eq("id", id);
                  if (error) { alert(error.message); return; }
                  await loadOrders("admin");
                }}
                onDeleteOrder={async (id) => {
                  if (!window.confirm("Delete this order?")) return;
                  const { error: itemError } = await supabase.from("order_items").delete().eq("order_id", id);
                  if (itemError) { alert(itemError.message); return; }
                  const { error } = await supabase.from("orders").delete().eq("id", id);
                  if (error) { alert(error.message); return; }
                  await loadOrders("admin");
                }}
                onEditProduct={async (id, updates) => {
                  const { error } = await supabase.from("products").update(updates).eq("id", id);
                  if (error) { alert(error.message); return; }
                  await loadProducts();
                }}
                onDeleteProduct={async (id) => {
                  if (!window.confirm("Delete this product?")) return;
                  const { error } = await supabase.from("products").delete().eq("id", id);
                  if (error) { alert(error.message); return; }
                  await loadProducts();
                }}
              />
            )}
            {role === "admin" && page === "admin-reviews" && <AdminReviews reviews={reviews} />}
            {role === "admin" && page === "admin-admins" && (
              <AdminAdmins
                admins={adminUsersData.filter((u) => u.role === "admin")}
                onRoleChange={async (id, newRole) => {
                  const { error } = await supabase.rpc("admin_change_user_role", { target_user_id: id, new_role: newRole });
                  if (error) { alert(error.message); return; }
                  await loadAdminUsers();
                  await loadVets();
                }}
                onDelete={async (id) => {
                  if (!window.confirm("Delete this admin profile? This cannot be undone.")) return;
                  const { error } = await supabase.rpc("admin_delete_user", { target_user_id: id });
                  if (error) { alert(error.message); return; }
                  await loadAdminUsers();
                  await loadVets();
                }}
              />
            )}
          </main>
        </div>
      </div>

      {addPetOpen && <AddPetModal onClose={() => setAddPetOpen(false)} onAdd={addPet} />}
      {addVetOpen && (
        <AddVetModal
          onClose={() => setAddVetOpen(false)}
          onAdd={async (vet) => {
            const { data, error } = await supabase
              .from("veterinarians")
              .insert({
                name: vet.name,
                specialty: vet.specialty,
                location: vet.location,
                fee: vet.fee,
                experience: vet.experience,
                online: vet.online,
                in_person: vet.inPerson,
                rating: vet.rating,
              })
              .select()
              .single();

            if (error) {
              console.error("Error adding veterinarian:", error);
              alert(error.message);
              return;
            }

            setVets((currentVets) => [
              ...currentVets,
              {
                id: String(data.id),
                name: data.name,
                specialty: data.specialty,
                rating: Number(data.rating || 0),
                experience: data.experience,
                location: data.location,
                fee: Number(data.fee || 0),
                online: data.online,
                inPerson: data.in_person,
              },
            ]);

            setAddVetOpen(false);
          }}
        />
      )}
      {addProductOpen && (
        <AddProductModal
          onClose={() => setAddProductOpen(false)}
          onAdd={async (product) => {
            // products.id is TEXT in the current database schema.
            // Generate a unique text ID instead of trying to insert a bigint.
            let newProductId = `pr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            while (products.some((existingProduct) => String(existingProduct.id) === newProductId)) {
              newProductId = `pr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            }

            const { data, error } = await supabase
              .from("products")
              .insert({
                id: newProductId,
                name: product.name,
                category: product.category,
                price: product.price,
                rating: product.rating,
              })
              .select()
              .single();

            if (error) {
              console.error("Error adding product:", error);
              alert(error.message);
              return;
            }

            setProducts((currentProducts) => [
              data,
              ...currentProducts,
            ]);

            setAddProductOpen(false);
          }}
        />
      )}
      {petDetail && (<PetDetailModal pet={petDetail} onClose={() => setPetDetail(null)} vetMode={role === "vet"} vetName={userName} onSaveNote={saveConsultationNote} onAddPrescription={addPrescription} onAddVaccination={addVaccination} />)}
      {bookingVet && (<BookAppointmentModal vet={bookingVet} pets={pets} availability={vetAvailability[bookingVet?.id] || {}} onClose={() => setBookingVet(null)} onConfirm={bookAppointment} />)}
      {rescheduleAppt && (<RescheduleModal appt={rescheduleAppt} availability={vetAvailability[rescheduleAppt?.vetId] || {}} onClose={() => setRescheduleAppt(null)} onConfirm={async (date, time) => {
        const { error } = await supabase
          .from("appointments")
          .update({
            appointment_date: date,
            appointment_time: time,
          })
          .eq("id", rescheduleAppt.id);

        if (error) {
          console.error("Error rescheduling appointment:", error);
          alert(error.message);
          return;
        }

        setAppointments((currentAppointments) =>
          currentAppointments.map((appointment) =>
            appointment.id === rescheduleAppt.id
              ? {
                ...appointment,
                date: fmtDate(
                  new Date(date + "T00:00:00")
                ),
                time,
              }
              : appointment
          )
        );

        setRescheduleAppt(null);
      }} />)}
    </Shell>
  );
}

function aiReply(text) {
  const t = text.toLowerCase();
  if (t.includes("scratch")) return "Frequent scratching can be caused by fleas, allergies, dry skin, or a mild infection. Check for redness, scabs, or visible pests, and avoid harsh shampoos in the meantime. If it continues past 2–3 days or the skin looks irritated, it's best to book a vet visit — I can help you find one.";
  if (t.includes("vomit")) return "Occasional vomiting can be normal, but repeated vomiting, lethargy, or blood are red flags. Withhold food for a few hours and offer small amounts of water. If it happens more than twice in a day, please consult a vet promptly.";
  if (t.includes("food") || t.includes("diet") || t.includes("eat")) return "A balanced diet depends on your pet's age, breed, and activity level. As a general guide: puppies/kittens need frequent small meals, adults do well on 2 meals a day, and seniors benefit from lower-calorie, joint-supportive food. Want me to suggest a schedule based on one of your pet profiles?";
  if (t.includes("vaccin")) return "Core vaccinations (like Rabies and DHPP for dogs, or FVRCP for cats) should stay on schedule roughly once a year after the initial series. I can check your pets' upcoming due dates from your reminders.";
  if (t.includes("groom")) return "Most short-haired pets do well with grooming every 4–6 weeks; long-haired breeds may need it every 2–3 weeks, plus regular brushing at home to prevent matting.";
  return "Thanks for sharing that. In general, keep an eye on appetite, energy, and bathroom habits — those are the best early indicators something's off. This is general guidance only, not a diagnosis, so for anything persistent or severe, please consult a veterinarian. Want me to help you find one nearby?";
}

/* ---------------------------------------------------------------
   SHELL / GLOBAL STYLE WRAPPER
---------------------------------------------------------------- */


function FloatingPetBackground() {
  const layerRef = useRef(null);

  const items = [
    [catSilhouette, 5, 8, 92, -8, 0.19, 0.10, 0.04],
    [dogSilhouette, 19, 18, 104, 9, 0.18, -0.07, 0.03],
    [fishSilhouette, 35, 7, 84, -7, 0.16, 0.08, -0.05],
    [boneSilhouette, 51, 15, 88, 12, 0.18, -0.06, 0.04],
    [catSilhouette, 70, 7, 76, 7, 0.15, 0.05, 0.05],
    [dogSilhouette, 87, 17, 96, -10, 0.17, -0.08, -0.03],

    [fishSilhouette, 9, 30, 78, 8, 0.17, 0.06, 0.04],
    [boneSilhouette, 27, 34, 64, -13, 0.16, -0.05, -0.04],
    [catSilhouette, 44, 27, 91, 11, 0.17, 0.07, 0.03],
    [dogSilhouette, 62, 34, 82, -6, 0.16, -0.06, 0.05],
    [fishSilhouette, 80, 29, 88, 10, 0.18, 0.08, -0.04],
    [boneSilhouette, 94, 38, 66, -9, 0.16, -0.05, 0.03],

    [dogSilhouette, 3, 51, 98, 7, 0.16, 0.07, -0.03],
    [fishSilhouette, 20, 49, 70, -10, 0.17, -0.06, 0.04],
    [boneSilhouette, 37, 57, 94, 6, 0.15, 0.05, 0.05],
    [catSilhouette, 56, 50, 84, -9, 0.18, -0.07, -0.04],
    [dogSilhouette, 75, 55, 72, 12, 0.16, 0.06, 0.03],
    [fishSilhouette, 91, 52, 92, -8, 0.18, -0.08, -0.05],

    [boneSilhouette, 11, 69, 82, -7, 0.17, 0.05, -0.04],
    [catSilhouette, 29, 73, 96, 8, 0.18, -0.06, 0.04],
    [fishSilhouette, 47, 67, 72, 10, 0.16, 0.07, 0.05],
    [dogSilhouette, 65, 76, 100, -11, 0.17, -0.05, -0.04],
    [boneSilhouette, 83, 70, 78, 6, 0.16, 0.06, 0.03],

    [catSilhouette, 2, 88, 78, 10, 0.17, -0.07, 0.04],
    [fishSilhouette, 18, 91, 94, -8, 0.18, 0.06, -0.04],
    [dogSilhouette, 38, 85, 76, 7, 0.16, -0.05, 0.05],
    [boneSilhouette, 55, 94, 90, -12, 0.17, 0.07, -0.03],
    [catSilhouette, 72, 88, 82, 9, 0.16, -0.06, 0.04],
    [fishSilhouette, 89, 91, 96, -7, 0.18, 0.05, -0.05],
  ];

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    const nodes = Array.from(layer.querySelectorAll(".pawcare-floating-pet"));
    let frame = null;
    let lastTime = performance.now();
    let mouseX = -1000;
    let mouseY = -1000;
    let pointerInside = false;

    const state = nodes.map((node) => ({
      x: Number(node.dataset.x),
      y: Number(node.dataset.y),
      vx: Number(node.dataset.vx),
      vy: Number(node.dataset.vy),
      baseRotation: Number(node.dataset.rotate),
      rotation: Number(node.dataset.rotate),
      rotationSpeed: Number(node.dataset.rotationSpeed),
    }));

    const update = (now) => {
      frame = null;
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dt = Math.min((now - lastTime) / 16.67, 2);
      lastTime = now;

      const bubbleRadius = Math.min(185, Math.max(125, width * 0.12));
      const pushStrength = 0.22;

      nodes.forEach((node, index) => {
        const item = state[index];

        // Very gentle continuous drifting so the background is always alive.
        item.x += item.vx * dt;
        item.y += item.vy * dt;

        // Wrap around the viewport so images continuously circulate.
        const marginX = (Number(node.offsetWidth) / Math.max(width, 1)) * 50;
        const marginY = (Number(node.offsetHeight) / Math.max(height, 1)) * 50;
        if (item.x < -marginX) item.x = 100 + marginX;
        if (item.x > 100 + marginX) item.x = -marginX;
        if (item.y < -marginY) item.y = 100 + marginY;
        if (item.y > 100 + marginY) item.y = -marginY;

        let pushX = 0;
        let pushY = 0;
        const currentX = item.x / 100 * width;
        const currentY = item.y / 100 * height;
        const dx = currentX - mouseX;
        const dy = currentY - mouseY;
        const distance = Math.hypot(dx, dy);

        if (pointerInside && distance < bubbleRadius) {
          const safeDistance = distance || 1;
          const strength = Math.pow(1 - distance / bubbleRadius, 2);
          pushX = (dx / safeDistance) * strength * 48;
          pushY = (dy / safeDistance) * strength * 48;

          // Give the drifting image a small outward velocity while inside the bubble.
          item.vx += (dx / safeDistance) * strength * pushStrength * dt;
          item.vy += (dy / safeDistance) * strength * pushStrength * dt;
        }

        // Keep movement gentle and bounded.
        const maxSpeed = 0.20;
        item.vx = Math.max(-maxSpeed, Math.min(maxSpeed, item.vx));
        item.vy = Math.max(-maxSpeed, Math.min(maxSpeed, item.vy));

        item.rotation += item.rotationSpeed * dt;
        const renderX = currentX + pushX;
        const renderY = currentY + pushY;

        node.style.left = `${(renderX / width) * 100}%`;
        node.style.top = `${(renderY / height) * 100}%`;
        node.style.transform = `translate3d(-50%, -50%, 0) rotate(${item.rotation}deg)`;
      });

      frame = requestAnimationFrame(update);
    };

    const handlePointerMove = (event) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
      pointerInside = true;
      if (!frame) frame = requestAnimationFrame(update);
    };

    const handlePointerLeave = () => {
      pointerInside = false;
      mouseX = -1000;
      mouseY = -1000;
    };

    const handleResize = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerleave", handlePointerLeave, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });

    frame = requestAnimationFrame(update);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("resize", handleResize);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={layerRef} className="pawcare-floating-background" aria-hidden="true">
      {items.map(([src, x, y, size, rotate, opacity, vx, vy], index) => (
        <img
          key={index}
          src={src}
          alt=""
          className="pawcare-floating-pet"
          data-x={x}
          data-y={y}
          data-rotate={rotate}
          data-vx={vx}
          data-vy={vy}
          data-rotation-speed={index % 2 === 0 ? 0.035 : -0.028}
          style={{
            left: `${x}%`,
            top: `${y}%`,
            width: size,
            opacity,
          }}
        />
      ))}
    </div>
  );
}

function Shell({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "Inter, sans-serif", color: "var(--ink)", position: "relative", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap');
        :root {
          --bg: #F5F4EE;
          --surface: #FFFFFF;
          --primary: #1F4B43;
          --primary-dark: #14332D;
          --primary-tint: #E4ECE9;
          --accent: #E2A33B;
          --accent-tint: #FBEDD6;
          --ink: #23231F;
          --muted: #746F63;
          --line: #E4E1D6;
          --alert: #C65D3B;
          --alert-tint: #F5E3DB;
        }
        * { box-sizing: border-box; }
        body { margin: 0; }
        ::placeholder { color: #A9A498; }
        button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible {
          outline: 2px solid var(--primary); outline-offset: 2px;
        }
        .pawcare-floating-background {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          overflow: hidden;
        }
        .pawcare-floating-pet {
          position: absolute;
          display: block;
          height: auto;
          max-width: none;
          user-select: none;
          pointer-events: none;
          will-change: transform, left, top;
          filter: saturate(0.9);
        }
        @media (max-width: 860px) {
          .pawcare-floating-pet {
            opacity: 0.11 !important;
          }
        }
        @media (max-width: 860px) {
          .hide-mobile { display: none !important; }
        }
      `}</style>
      <FloatingPetBackground />
      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
        {children}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   LANDING PAGE
---------------------------------------------------------------- */

function Landing({ onStart }) {
  const modules = [
    { icon: Heart, title: "Pet profiles", text: "Track breed, weight, vaccinations, and medical history for every pet you own." },
    { icon: Stethoscope, title: "Vet appointments", text: "Search verified vets, compare fees, and book online or in-person visits." },
    { icon: Bell, title: "Care reminders", text: "Never miss a vaccination, deworming dose, or grooming day again." },
    { icon: ShoppingBag, title: "Pet essentials", text: "Order food, toys, and medicine, and track delivery in one place." },
    { icon: MessageCircle, title: "AI care assistant", text: "Ask about symptoms, diet, and daily routines, with guidance on when to see a vet." },
    { icon: AlertTriangle, title: "Emergency help", text: "Find the nearest 24x7 clinic in seconds when it matters most." },
  ];
  return (
    <div>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 32px", maxWidth: 1180, margin: "0 auto" }}>
        <Logo />
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="ghost" onClick={onStart}>Sign in</Btn>
          <Btn variant="primary" onClick={onStart}>Get started</Btn>
        </div>
      </header>

      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "40px 32px 70px", display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 48, alignItems: "center" }}>
        <div>
          <div style={{ color: "var(--primary)", fontWeight: 600, fontSize: 14.5, marginBottom: 14 }}>Everything your pet needs, in one place</div>
          <h1 style={{ fontFamily: "Fraunces, serif", fontSize: "clamp(34px, 5vw, 54px)", lineHeight: 1.08, margin: 0, fontWeight: 600, letterSpacing: "-0.01em" }}>
            Calmer pet care, from checkups to 2am worries.
          </h1>
          <p style={{ fontSize: 17, color: "var(--muted)", marginTop: 18, maxWidth: 480, lineHeight: 1.6 }}>
            Keep every pet's records, appointments, and reminders together, book trusted vets in minutes, and get quick AI guidance before deciding whether a visit is needed.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap" }}>
            <Btn size="lg" onClick={onStart} icon={ArrowRight}>Create your account</Btn>
            <Btn size="lg" variant="outline" onClick={onStart}>I already have one</Btn>
          </div>
        </div>
        <div style={{ position: "relative" }}>
          <div style={{ background: "var(--primary)", borderRadius: 24, padding: 26, color: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Heart size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 17 }}>Your pet care, organized</div>
                <div style={{ fontSize: 12.5, opacity: 0.75 }}>One place for the records that matter.</div>
              </div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 14, padding: 16, marginBottom: 12 }}>
              <div style={{ fontSize: 12.5, opacity: 0.75, marginBottom: 4 }}>Pet records</div>
              <div style={{ fontWeight: 600, fontSize: 15.5 }}>Pets, vaccinations, medical records</div>
              <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>Stored with your account and loaded from the database.</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 14, padding: 16 }}>
              <div style={{ fontSize: 12.5, opacity: 0.75, marginBottom: 8 }}>Appointments</div>
              <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>Find veterinarians, choose available slots, and keep your appointment history together.</div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ background: "var(--surface)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", padding: "60px 32px" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 28, marginBottom: 8, fontWeight: 600 }}>One platform, every part of pet care</h2>
          <p style={{ color: "var(--muted)", marginBottom: 36, maxWidth: 520 }}>Built for pet owners, veterinarians, and clinic admins alike.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 22 }}>
            {modules.map((m) => (
              <div key={m.title} style={{ padding: 22, borderRadius: 16, border: "1px solid var(--line)" }}>
                <div style={{ width: 42, height: 42, borderRadius: 11, background: "var(--primary-tint)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  <m.icon size={21} color="var(--primary)" />
                </div>
                <div style={{ fontWeight: 600, fontSize: 16.5, marginBottom: 6 }}>{m.title}</div>
                <div style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.55 }}>{m.text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "60px 32px", textAlign: "center" }}>
        <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 28, fontWeight: 600, marginBottom: 14 }}>Ready when your pet needs you.</h2>
        <p style={{ color: "var(--muted)", marginBottom: 24 }}>Set up a profile for each pet in under two minutes.</p>
        <Btn size="lg" onClick={onStart} icon={ArrowRight}>Get started free</Btn>
      </section>

      <footer style={{ padding: "26px 32px", borderTop: "1px solid var(--line)", color: "var(--muted)", fontSize: 13, textAlign: "center" }}>
        © 2026 Pawcare. A student internship project.
      </footer>
    </div>
  );
}

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", minWidth: 0 }}>
      <img
        src={pawcareLogo}
        alt="PawCare"
        style={{ width: 172, maxWidth: "100%", height: "auto", display: "block", objectFit: "contain" }}
      />
    </div>
  );
}

/* ---------------------------------------------------------------
   AUTH
---------------------------------------------------------------- */

function AuthScreen({ mode, setMode, onAuth }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "owner",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (mode === "register" && !form.name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!form.email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!form.password) {
      setError("Please enter your password.");
      return;
    }

    if (mode === "register" && form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      await onAuth({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      });
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 26,
          }}
        >
          <Logo />
        </div>

        <Panel style={{ padding: 30 }}>
          <h2
            style={{
              fontFamily: "Fraunces, serif",
              fontSize: 23,
              fontWeight: 600,
              marginTop: 0,
              marginBottom: 4,
            }}
          >
            {mode === "login"
              ? "Welcome back"
              : "Create your account"}
          </h2>

          <p
            style={{
              color: "var(--muted)",
              fontSize: 14,
              marginBottom: 22,
            }}
          >
            {mode === "login"
              ? "Sign in to manage your pets and appointments."
              : "Set up your account to get started."}
          </p>

          <form onSubmit={handleSubmit}>
            {mode === "register" && (
              <Field label="Full name">
                <input
                  style={inputStyle}
                  placeholder="Your name"
                  value={form.name}
                  onChange={(e) =>
                    updateField("name", e.target.value)
                  }
                  autoComplete="name"
                />
              </Field>
            )}

            {mode === "register" && (
              <Field label="Account type">
                <select
                  style={inputStyle}
                  value={form.role}
                  onChange={(e) =>
                    updateField("role", e.target.value)
                  }
                >
                  <option value="owner">Pet owner</option>
                  <option value="vet">Veterinarian</option>
                </select>
              </Field>
            )}

            <Field label="Email">
              <input
                style={inputStyle}
                placeholder="you@example.com"
                type="email"
                value={form.email}
                onChange={(e) =>
                  updateField("email", e.target.value)
                }
                autoComplete="email"
              />
            </Field>

            <Field label="Password">
              <input
                style={inputStyle}
                placeholder="••••••••"
                type="password"
                value={form.password}
                onChange={(e) =>
                  updateField("password", e.target.value)
                }
                autoComplete={
                  mode === "login"
                    ? "current-password"
                    : "new-password"
                }
              />
            </Field>

            {error && (
              <div
                style={{
                  background: "var(--alert-tint)",
                  color: "var(--alert)",
                  borderRadius: 9,
                  padding: "10px 12px",
                  fontSize: 13,
                  marginBottom: 14,
                }}
              >
                {error}
              </div>
            )}

            <Btn
              type="submit"
              style={{
                width: "100%",
                marginTop: 6,
              }}
              size="lg"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}
            </Btn>
          </form>

          <div
            style={{
              textAlign: "center",
              marginTop: 18,
              fontSize: 13.5,
              color: "var(--muted)",
            }}
          >
            {mode === "login" ? (
              <>
                Don't have an account?{" "}
                <a
                  onClick={() => {
                    setMode("register");
                    setError("");
                  }}
                  style={{
                    color: "var(--primary)",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Register
                </a>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <a
                  onClick={() => {
                    setMode("login");
                    setError("");
                  }}
                  style={{
                    color: "var(--primary)",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Sign in
                </a>
              </>
            )}
          </div>
        </Panel>

        <div
          style={{
            textAlign: "center",
            marginTop: 16,
          }}
        >
          <a
            onClick={() => {
              setMode("landing");
              setError("");
            }}
            style={{
              color: "var(--muted)",
              fontSize: 13.5,
              cursor: "pointer",
            }}
          >
            ← Back to home
          </a>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   SIDEBAR + TOPBAR
---------------------------------------------------------------- */

function Sidebar({ role, userName, page, setPage, onLogout, open, setOpen, visible, onHide, }) {
  const items = NAV[role];
  const roleLabel = { owner: "Pet owner", vet: "Veterinarian", admin: "Admin" }[role];
  const displayName = userName || roleLabel;
  const content = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "22px 20px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Logo />
        <button onClick={onHide} className="hide-mobile" title="Hide sidebar" style={{ background: "var(--line)", border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", }} >
          <ChevronLeft size={16} />
        </button>
        <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", display: open ? "block" : "none" }}>
          <X size={18} />
        </button>
      </div>
      <nav style={{ flex: 1, padding: "6px 12px", overflowY: "auto" }}>
        {items.map((it) => {
          const active = page === it.id;
          return (
            <button
              key={it.id}
              onClick={() => { setPage(it.id); setOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 11, width: "100%", padding: "10px 12px",
                borderRadius: 10, border: "none", cursor: "pointer", marginBottom: 3, textAlign: "left",
                background: active ? "var(--primary-tint)" : "transparent",
                color: active ? "var(--primary)" : "var(--ink)", fontWeight: active ? 600 : 500, fontSize: 14.5,
                fontFamily: "Inter, sans-serif",
              }}
            >
              <it.icon size={18} />
              {it.label}
            </button>
          );
        })}
      </nav>
      <div style={{ padding: 16, borderTop: "1px solid var(--line)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <Avatar label={displayName} size={36} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {displayName}
            </div>
            <div style={{ color: "var(--muted)", fontSize: 12 }}>{roleLabel}</div>
          </div>
        </div>
        <Btn variant="subtle" size="sm" icon={LogOut} onClick={onLogout} style={{ width: "100%" }}>Log out</Btn>
      </div>
    </div>
  );

  return (
    <>
      {visible && (
        <div className="hide-mobile" style={{ width: 240, height: "100vh", position: "fixed", left: 0, top: 0, zIndex: 40, borderRight: "1px solid var(--line)", background: "var(--surface)" }} >
          {content}
        </div>
      )}
      {open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(0,0,0,0.4)" }} onClick={() => setOpen(false)}>
          <div style={{ width: 260, height: "100%", background: "var(--surface)" }} onClick={(e) => e.stopPropagation()}>
            {content}
          </div>
        </div>
      )}
    </>
  );
}

function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function NotificationDropdown({ notifications, onClose }) {
  return (
    <div
      style={{
        position: "absolute",
        top: 48,
        right: 0,
        width: 340,
        maxWidth: "calc(100vw - 32px)",
        maxHeight: 420,
        overflowY: "auto",
        background: "#fff",
        border: "1px solid var(--line)",
        borderRadius: 14,
        boxShadow: "0 12px 35px rgba(0,0,0,0.14)",
        zIndex: 50,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid var(--line)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          background: "#fff",
        }}
      >
        <div style={{ fontWeight: 700 }}>Notifications</div>

        <button
          onClick={onClose}
          style={{
            border: "none",
            background: "var(--line)",
            borderRadius: 7,
            width: 28,
            height: 28,
            cursor: "pointer",
          }}
        >
          <X size={15} />
        </button>
      </div>

      {notifications.length === 0 && (
        <div style={{ padding: "28px 16px", textAlign: "center", color: "var(--muted)", fontSize: 13.5 }}>
          You're all caught up — no notifications yet.
        </div>
      )}

      {notifications.map((n) => (
        <div
          key={n.id}
          style={{
            padding: "14px 16px",
            borderBottom: "1px solid var(--line)",
            background: n.read ? "transparent" : "var(--primary-tint)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: "var(--primary-tint)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Bell size={15} color="var(--primary)" />
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>
                  {n.title}
                </div>
                <div style={{ color: "var(--muted)", fontSize: 11, flexShrink: 0, marginTop: 1 }}>
                  {timeAgo(n.created_at)}
                </div>
              </div>

              <div
                style={{
                  color: "var(--muted)",
                  fontSize: 12.5,
                  lineHeight: 1.45,
                  marginTop: 3,
                }}
              >
                {n.body}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TopBar({
  role,
  onMenu,
  cartCount,
  onCart,
  sidebarVisible,
  notifications,
  onOpenNotifications,
}) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 24px",
        borderBottom: "1px solid var(--line)",
        background: "var(--surface)",
        position: "sticky",
        top: 0,
        zIndex: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          onClick={onMenu}
          style={{
            background: "var(--line)",
            border: "none",
            borderRadius: 8,
            width: 34,
            height: 34,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title={sidebarVisible ? "Hide sidebar" : "Show sidebar"}
        >
          <Menu size={17} />
        </button>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        {role === "owner" && (
          <button
            onClick={onCart}
            style={{
              position: "relative",
              background: "var(--bg)",
              border: "1px solid var(--line)",
              borderRadius: 10,
              width: 38,
              height: 38,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShoppingBag size={17} />

            {cartCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -5,
                  right: -5,
                  background: "var(--alert)",
                  color: "#fff",
                  fontSize: 10.5,
                  fontWeight: 700,
                  borderRadius: 999,
                  width: 17,
                  height: 17,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {cartCount}
              </span>
            )}
          </button>
        )}

        <div style={{ position: "relative" }}>
          <button
            onClick={() => {
              const opening = !notificationsOpen;
              setNotificationsOpen(opening);
              if (opening && unreadCount > 0) {
                onOpenNotifications();
              }
            }}
            style={{
              position: "relative",
              background: "var(--bg)",
              border: "1px solid var(--line)",
              borderRadius: 10,
              width: 38,
              height: 38,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Bell size={17} />

            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  background: "var(--alert)",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 700,
                  borderRadius: 999,
                  minWidth: 16,
                  height: 16,
                  padding: "0 4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <NotificationDropdown
              notifications={notifications}
              onClose={() => setNotificationsOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   OWNER: HOME / OVERVIEW
---------------------------------------------------------------- */

function OwnerHome({ userName, pets, appointments, reminders, setPage, setPetDetail }) {
  const upcoming = appointments.filter((a) => appointmentIsUpcoming(a)).slice(0, 3);

  // Vaccination progress is derived from the vaccination records loaded from
  // Supabase for the owner's pets. Nothing is hard-coded here. A vaccination
  // is considered on track when it is completed or scheduled/upcoming.
  const vaccinationRecords = pets.flatMap((pet) => pet.vaccinations || []);
  const totalVaccinations = vaccinationRecords.length;
  const vaccinationsOnTrack = vaccinationRecords.filter(
    (vaccination) => vaccination.status === "done" || vaccination.status === "upcoming"
  ).length;
  const vaccinationTracker = `${vaccinationsOnTrack}/${totalVaccinations}`;

  return (
    <div>
      <PageHeader eyebrow="Welcome back" title={`${userName || "there"}, here's today's care summary`} subtitle="Everything about your pets, appointments, and reminders at a glance." />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 26 }}>
        <StatCard icon={Heart} label="Pets registered" value={pets.length} />
        <StatCard icon={Calendar} label="Upcoming visits" value={appointments.filter((a) => appointmentIsUpcoming(a)).length} />
        <StatCard icon={Bell} label="Reminders due" value={reminders.length} tone="accent" />
        <StatCard icon={ShieldCheck} label="Vaccinations on track" value={vaccinationTracker} tone="primary" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>
        <Panel>
          <SectionTitle title="Your pets" action={<a onClick={() => setPage("owner-pets")} style={linkStyle}>View all</a>} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pets.map((p) => (
              <div key={p.id} onClick={() => setPetDetail(p)} style={rowStyle}>
                <Avatar label={p.name} size={42} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{p.name}</div>
                  <div style={{ color: "var(--muted)", fontSize: 13 }}>{p.breed} · {p.age}</div>
                </div>
                <ChevronRight size={17} color="var(--muted)" />
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <SectionTitle title="Upcoming appointments" action={<button type="button" onClick={() => setPage("owner-appointments")} style={{ ...linkStyle, border: 0, background: "transparent", padding: 0, font: "inherit" }}>View all</button>} />
          {upcoming.length === 0 && <EmptyNote text="No upcoming appointments yet." />}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {upcoming.map((a) => (
              <div key={a.id} style={rowStyle}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: "var(--primary-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Calendar size={18} color="var(--primary)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{a.vetName}</div>
                  <div style={{ color: "var(--muted)", fontSize: 12.5 }}>{a.petName} · {a.date}, {a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel style={{ marginTop: 20 }}>
        <SectionTitle title="Reminders" action={<a onClick={() => setPage("owner-reminders")} style={linkStyle}>View all</a>} />
        {(() => {
          const appointmentItems = appointments
            .filter((a) => appointmentIsUpcoming(a))
            .map((a) => ({
              id: `appointment-${a.id}`,
              appointment: true,
              dateKey: `${a.appointmentDate || ""} ${a.time || ""}`,
              title: `${a.petName}'s appointment with ${a.vetName}`,
              due: `${a.date}, ${a.time} · ${a.mode}`,
            }));
          const reminderItems = reminders.map((r) => ({
            id: `reminder-${r.id}`,
            appointment: false,
            dateKey: `${r.due || ""}`,
            title: `${r.petName}'s ${String(r.type || "reminder").toLowerCase()}`,
            due: r.due,
          }));
          const items = [...appointmentItems, ...reminderItems].sort((a, b) => a.dateKey.localeCompare(b.dateKey)).slice(0, 5);
          return items.length === 0 ? (
            <EmptyNote text="No upcoming reminders or scheduled appointments." />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
              {items.map((item) => (
                <div key={item.id} style={{ ...rowStyle, cursor: "default" }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: item.appointment ? "var(--primary-tint)" : "var(--accent-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {item.appointment ? <Calendar size={16} color="var(--primary)" /> : <Bell size={16} color="#8A5A16" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{item.title}</div>
                    <div style={{ color: "var(--muted)", fontSize: 12.5 }}>{item.due}</div>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </Panel>
    </div>
  );
}

const rowStyle = { display: "flex", alignItems: "center", gap: 12, padding: "10px 10px", borderRadius: 10, cursor: "pointer", border: "1px solid var(--line)" };
const linkStyle = { color: "var(--primary)", fontWeight: 600, fontSize: 13.5, cursor: "pointer" };

function SectionTitle({ title, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
      <h3 style={{ fontSize: 16.5, fontWeight: 600, margin: 0 }}>{title}</h3>
      {action}
    </div>
  );
}

function EmptyNote({ text }) {
  return <div style={{ color: "var(--muted)", fontSize: 13.5, padding: "14px 0" }}>{text}</div>;
}

function StatCard({ icon: Icon, label, value, tone = "default", onClick }) {
  const tones = { default: "var(--ink)", accent: "#8A5A16", primary: "var(--primary)" };
  const cardStyle = {
    padding: 18,
    cursor: onClick ? "pointer" : "default",
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
  };

  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: 14,
        ...cardStyle,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={16} color={tones[tone]} />
        </div>
      </div>
      <div style={{ fontFamily: "Fraunces, serif", fontSize: 24, fontWeight: 600 }}>{value}</div>
      <div style={{ color: "var(--muted)", fontSize: 13 }}>{label}</div>
    </div>
  );
}

/* ---------------------------------------------------------------
   OWNER: PETS
---------------------------------------------------------------- */

function OwnerPets({ pets, onAdd, onOpen }) {
  return (
    <div>
      <PageHeader title="My pets" subtitle="Every pet's identity, vitals, and history in one profile." action={<Btn icon={Plus} onClick={onAdd}>Add a pet</Btn>} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
        {pets.map((p) => (
          <Panel key={p.id} style={{ cursor: "pointer" }}>
            <div onClick={() => onOpen(p)}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <Avatar label={p.name} size={50} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 17 }}>{p.name}</div>
                  <div style={{ color: "var(--muted)", fontSize: 13 }}>{p.species} · {p.breed}</div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13 }}>
                <PetStat label="Age" value={p.age} />
                <PetStat label="Weight" value={p.weight} />
                <PetStat label="Gender" value={p.gender} />
                <PetStat label="Vaccines due" value={p.vaccinations.filter((v) => v.status !== "done").length} />
              </div>
            </div>
            <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
              <Badge tone="primary">{p.medical.length} medical record{p.medical.length !== 1 ? "s" : ""}</Badge>
            </div>
          </Panel>
        ))}
        <button onClick={onAdd} style={{
          border: "1.5px dashed var(--line)", borderRadius: 14, background: "transparent", cursor: "pointer",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
          color: "var(--muted)", minHeight: 170,
        }}>
          <Plus size={22} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>Add another pet</span>
        </button>
      </div>
    </div>
  );
}

function PetStat({ label, value }) {
  return (
    <div style={{ background: "var(--bg)", borderRadius: 8, padding: "7px 10px" }}>
      <div style={{ color: "var(--muted)", fontSize: 11 }}>{label}</div>
      <div style={{ fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function AddPetModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ name: "", species: "Dog", breed: "", age: "", weight: "", gender: "Male" });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <Modal title="Add a new pet" onClose={onClose}>
      <Field label="Pet name"><input style={inputStyle} value={form.name} onChange={set("name")} placeholder="e.g. Bruno" /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Species">
          <select style={inputStyle} value={form.species} onChange={set("species")}>
            <option>Dog</option><option>Cat</option><option>Bird</option><option>Rabbit</option><option>Other</option>
          </select>
        </Field>
        <Field label="Gender">
          <select style={inputStyle} value={form.gender} onChange={set("gender")}>
            <option>Male</option><option>Female</option>
          </select>
        </Field>
      </div>
      <Field label="Breed"><input style={inputStyle} value={form.breed} onChange={set("breed")} placeholder="e.g. Labrador" /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Age"><input style={inputStyle} value={form.age} onChange={set("age")} placeholder="e.g. 2 yrs" /></Field>
        <Field label="Weight"><input style={inputStyle} value={form.weight} onChange={set("weight")} placeholder="e.g. 12 kg" /></Field>
      </div>
      <Btn style={{ width: "100%", marginTop: 8 }} size="lg" disabled={!form.name} onClick={() => onAdd(form)}>Save pet profile</Btn>
    </Modal>
  );
}

function PetDetailModal({
  pet,
  onClose,
  vetMode,
  vetName,
  onSaveNote,
  onAddPrescription,
  onAddVaccination,
}) {
  const [tab, setTab] = useState("vaccinations");
  const [note, setNote] = useState("");
  const [prescriptionOpen, setPrescriptionOpen] = useState(false);
  const [vaccinationOpen, setVaccinationOpen] = useState(false);

  const handleSaveNote = () => {
    if (!note.trim()) return;

    onSaveNote(pet.id, note);
    setNote("");
  };

  return (
    <Modal title={pet.name + "'s profile"} onClose={onClose} width={560}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 18,
        }}
      >
        <Avatar label={pet.name} size={56} />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 6,
            flex: 1,
            fontSize: 13,
          }}
        >
          <PetStat label="Breed" value={pet.breed} />
          <PetStat label="Age" value={pet.age} />
          <PetStat label="Weight" value={pet.weight} />
          <PetStat label="Gender" value={pet.gender} />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 16,
          borderBottom: "1px solid var(--line)",
        }}
      >
        {["vaccinations", "medical", "prescriptions"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: "none",
              border: "none",
              padding: "9px 4px",
              marginRight: 18,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14,
              color:
                tab === t
                  ? "var(--primary)"
                  : "var(--muted)",
              borderBottom:
                tab === t
                  ? "2px solid var(--primary)"
                  : "2px solid transparent",
            }}
          >
            {t === "vaccinations"
              ? "Vaccination history"
              : t === "medical"
                ? "Medical records"
                : "Prescriptions"}
          </button>
        ))}
      </div>

      {/* Vaccination history */}
      {tab === "vaccinations" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {pet.vaccinations.length === 0 && (
            <EmptyNote text="No vaccination records yet." />
          )}

          {pet.vaccinations.map((v, i) => (
            <div
              key={i}
              style={{
                ...rowStyle,
                cursor: "default",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 9,
                  background: "var(--primary-tint)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ShieldCheck
                  size={16}
                  color="var(--primary)"
                />
              </div>

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  {v.name}
                </div>

                <div
                  style={{
                    color: "var(--muted)",
                    fontSize: 12.5,
                  }}
                >
                  {v.date}
                </div>
              </div>

              <Badge
                tone={
                  v.status === "done"
                    ? "success"
                    : v.status === "due"
                      ? "alert"
                      : "accent"
                }
              >
                {v.status}
              </Badge>
            </div>
          ))}

          {vetMode && (
            <Btn
              size="sm"
              icon={Plus}
              style={{ alignSelf: "flex-start", marginTop: 6 }}
              onClick={() => setVaccinationOpen(true)}
            >
              Add vaccination
            </Btn>
          )}
        </div>
      )}

      {/* Medical records */}
      {tab === "medical" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {pet.medical.length === 0 && (
            <EmptyNote text="No medical records yet." />
          )}

          {pet.medical.map((m, i) => (
            <div
              key={i}
              style={{
                padding: 12,
                borderRadius: 10,
                border: "1px solid var(--line)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: 13.5,
                  }}
                >
                  {m.vet}
                </span>

                <span
                  style={{
                    color: "var(--muted)",
                    fontSize: 12.5,
                  }}
                >
                  {m.date}
                </span>
              </div>

              <div
                style={{
                  fontSize: 13.5,
                  color: "var(--ink)",
                }}
              >
                {m.note}
              </div>
            </div>
          ))}

          {vetMode && (
            <div style={{ marginTop: 6 }}>
              <Field label="Add consultation note">
                <textarea
                  style={{
                    ...inputStyle,
                    minHeight: 70,
                    resize: "vertical",
                  }}
                  value={note}
                  onChange={(e) =>
                    setNote(e.target.value)
                  }
                  placeholder="Findings, treatment, follow-up..."
                />
              </Field>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                }}
              >
                <Btn
                  size="sm"
                  icon={FileText}
                  disabled={!note.trim()}
                  onClick={handleSaveNote}
                >
                  Save note
                </Btn>

                <Btn
                  size="sm"
                  variant="outline"
                  icon={FileText}
                  onClick={() =>
                    setPrescriptionOpen(true)
                  }
                >
                  Add prescription
                </Btn>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Prescriptions */}
      {tab === "prescriptions" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {!pet.prescriptions ||
            pet.prescriptions.length === 0 ? (
            <EmptyNote text="No prescriptions yet." />
          ) : (
            pet.prescriptions.map((p, i) => (
              <div
                key={i}
                style={{
                  padding: 14,
                  border: "1px solid var(--line)",
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <strong>{p.medicine}</strong>

                  <span
                    style={{
                      color: "var(--muted)",
                      fontSize: 12.5,
                    }}
                  >
                    {p.date}
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "1fr 1fr",
                    gap: 6,
                    fontSize: 13,
                  }}
                >
                  <div>
                    <span
                      style={{
                        color: "var(--muted)",
                      }}
                    >
                      Dosage:
                    </span>{" "}
                    {p.dosage}
                  </div>

                  <div>
                    <span
                      style={{
                        color: "var(--muted)",
                      }}
                    >
                      Frequency:
                    </span>{" "}
                    {p.frequency}
                  </div>

                  <div>
                    <span
                      style={{
                        color: "var(--muted)",
                      }}
                    >
                      Duration:
                    </span>{" "}
                    {p.duration}
                  </div>

                  <div>
                    <span
                      style={{
                        color: "var(--muted)",
                      }}
                    >
                      Prescribed by:
                    </span>{" "}
                    {p.vet}
                  </div>
                </div>

                {p.instructions && (
                  <div
                    style={{
                      marginTop: 9,
                      paddingTop: 9,
                      borderTop:
                        "1px solid var(--line)",
                      fontSize: 13,
                    }}
                  >
                    <span
                      style={{
                        color: "var(--muted)",
                      }}
                    >
                      Instructions:
                    </span>{" "}
                    {p.instructions}
                  </div>
                )}
              </div>
            ))
          )}

          {vetMode && (
            <Btn
              size="sm"
              icon={Plus}
              style={{ alignSelf: "flex-start" }}
              onClick={() =>
                setPrescriptionOpen(true)
              }
            >
              Add prescription
            </Btn>
          )}
        </div>
      )}

      {prescriptionOpen && (
        <AddPrescriptionModal
          pet={pet}
          vetName={vetName}
          onClose={() =>
            setPrescriptionOpen(false)
          }
          onAdd={(prescription) => {
            onAddPrescription(
              pet.id,
              prescription
            );
            setPrescriptionOpen(false);
            setTab("prescriptions");
          }}
        />
      )}

      {vaccinationOpen && (
        <AddVaccinationModal
          pet={pet}
          onClose={() => setVaccinationOpen(false)}
          onAdd={(vaccination) => {
            onAddVaccination(pet.id, vaccination);
            setVaccinationOpen(false);
            setTab("vaccinations");
          }}
        />
      )}
    </Modal>
  );
}

function AddPrescriptionModal({ pet, vetName, onClose, onAdd }) {
  const [form, setForm] = useState({
    medicine: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: "",
  });

  const set = (key) => (e) =>
    setForm((f) => ({
      ...f,
      [key]: e.target.value,
    }));

  const submit = () => {
    if (
      !form.medicine.trim() ||
      !form.dosage.trim() ||
      !form.frequency.trim() ||
      !form.duration.trim()
    ) {
      return;
    }

    onAdd({
      ...form,
      medicine: form.medicine.trim(),
      dosage: form.dosage.trim(),
      frequency: form.frequency.trim(),
      duration: form.duration.trim(),
      instructions: form.instructions.trim(),
      date: fmtDate(new Date()),
      vet: vetName || "Veterinarian",
    });
  };

  return (
    <Modal
      title={"Add prescription for " + pet.name}
      onClose={onClose}
      width={500}
    >
      <Field label="Medicine">
        <input
          style={inputStyle}
          value={form.medicine}
          onChange={set("medicine")}
          placeholder="e.g. Amoxicillin"
        />
      </Field>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
        }}
      >
        <Field label="Dosage">
          <input
            style={inputStyle}
            value={form.dosage}
            onChange={set("dosage")}
            placeholder="e.g. 250 mg"
          />
        </Field>

        <Field label="Frequency">
          <input
            style={inputStyle}
            value={form.frequency}
            onChange={set("frequency")}
            placeholder="e.g. Twice daily"
          />
        </Field>
      </div>

      <Field label="Duration">
        <input
          style={inputStyle}
          value={form.duration}
          onChange={set("duration")}
          placeholder="e.g. 7 days"
        />
      </Field>

      <Field label="Instructions">
        <textarea
          style={{
            ...inputStyle,
            minHeight: 85,
            resize: "vertical",
          }}
          value={form.instructions}
          onChange={set("instructions")}
          placeholder="e.g. Give after food. Complete the full course."
        />
      </Field>

      <div
        style={{
          background: "var(--bg)",
          borderRadius: 10,
          padding: 12,
          marginBottom: 14,
          fontSize: 12.5,
          color: "var(--muted)",
        }}
      >
        Prescription will be recorded under{" "}
        <strong>{pet.name}</strong>'s medical profile.
      </div>

      <Btn
        size="lg"
        style={{ width: "100%" }}
        disabled={
          !form.medicine.trim() ||
          !form.dosage.trim() ||
          !form.frequency.trim() ||
          !form.duration.trim()
        }
        onClick={submit}
      >
        Save prescription
      </Btn>
    </Modal>
  );
}

function AddVaccinationModal({ pet, onClose, onAdd }) {
  const [form, setForm] = useState({ name: "", status: "done" });
  const [dateValue, setDateValue] = useState(() => new Date().toISOString().slice(0, 10));

  const set = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = () => {
    if (!form.name.trim() || !dateValue) return;
    onAdd({
      name: form.name.trim(),
      date: dateValue,
      status: form.status,
    });
  };

  return (
    <Modal
      title={"Add vaccination for " + pet.name}
      onClose={onClose}
      width={460}
    >
      <Field label="Vaccine name">
        <input
          style={inputStyle}
          value={form.name}
          onChange={set("name")}
          placeholder="e.g. Rabies"
        />
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Date">
          <input
            type="date"
            style={inputStyle}
            value={dateValue}
            onChange={(e) => setDateValue(e.target.value)}
          />
        </Field>

        <Field label="Status">
          <select style={inputStyle} value={form.status} onChange={set("status")}>
            <option value="done">Done</option>
            <option value="due">Due</option>
            <option value="upcoming">Upcoming</option>
          </select>
        </Field>
      </div>

      <div
        style={{
          background: "var(--bg)",
          borderRadius: 10,
          padding: 12,
          marginBottom: 14,
          fontSize: 12.5,
          color: "var(--muted)",
        }}
      >
        This will be added to <strong>{pet.name}</strong>'s vaccination history.
      </div>

      <Btn
        size="lg"
        style={{ width: "100%" }}
        disabled={!form.name.trim() || !dateValue}
        onClick={submit}
      >
        Save vaccination
      </Btn>
    </Modal>
  );
}

/* ---------------------------------------------------------------
   OWNER: FIND VETS + BOOKING
---------------------------------------------------------------- */

function FindVets({ vets, onBook }) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("All");
  const filtered = vets.filter((v) => {
    const matchQ = v.name.toLowerCase().includes(query.toLowerCase()) || v.specialty.toLowerCase().includes(query.toLowerCase());
    const matchMode = mode === "All" || (mode === "Online" && v.online) || (mode === "In-person" && v.inPerson);
    return matchQ && matchMode;
  });
  return (
    <div>
      <PageHeader title="Find a veterinarian" subtitle="Compare specialties, ratings, and fees, then book a slot that works for you." />
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: 12, color: "var(--muted)" }} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or specialty" style={{ ...inputStyle, paddingLeft: 34 }} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["All", "Online", "In-person"].map((m) => (
            <button key={m} onClick={() => setMode(m)} style={{
              padding: "10px 14px", borderRadius: 9, fontSize: 13.5, fontWeight: 600, cursor: "pointer",
              border: mode === m ? "1.5px solid var(--primary)" : "1px solid var(--line)",
              background: mode === m ? "var(--primary-tint)" : "#fff", color: mode === m ? "var(--primary)" : "var(--ink)",
            }}>{m}</button>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
        {filtered.map((v) => (
          <Panel key={v.id}>
            <div style={{ display: "flex", gap: 14 }}>
              <Avatar label={v.name} size={54} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>{v.name}</div>
                    <div style={{ color: "var(--muted)", fontSize: 13 }}>{v.specialty}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13.5, fontWeight: 600 }}>
                    <Star size={13} fill="var(--accent)" color="var(--accent)" /> {v.rating}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 14, marginTop: 10, fontSize: 12.5, color: "var(--muted)", flexWrap: "wrap" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={13} /> {v.location}</span>
                  <span>{v.experience} experience</span>
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                  {v.online && <Badge tone="primary">Online</Badge>}
                  {v.inPerson && <Badge>In-person</Badge>}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--line)" }}>
              <div>
                <div style={{ fontFamily: "Fraunces, serif", fontSize: 19, fontWeight: 600 }}>₹{v.fee}</div>
                <div style={{ color: "var(--muted)", fontSize: 11.5 }}>consultation fee</div>
              </div>
              <Btn size="sm" onClick={() => onBook(v)}>Book appointment</Btn>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

function BookAppointmentModal({ vet, pets, availability, onClose, onConfirm }) {
  const [petId, setPetId] = useState(pets[0]?.id);
  const [dayIdx, setDayIdx] = useState(0);
  const [time, setTime] = useState(null);
  const [mode, setMode] = useState(vet.inPerson ? "In-person" : "Online");

  // `pets[x].id` comes straight from Supabase and can be a number, while
  // `petId` gets set from the <select>'s onChange, which always yields a
  // string — so a strict `===` comparison here silently fails to match and
  // falls back to the wrong pet. Compare as strings so the pet actually
  // booked always matches what's shown in the dropdown.
  const pet = pets.find((p) => String(p.id) === String(petId)) || pets[0] || null;
  const selectedDate = nextDays[dayIdx];
  const availableSlots = sortSlots(availability?.[selectedDate.getDay()] || []);
  return (
    <Modal title={"Book with " + vet.name} onClose={onClose} width={520}>
      <Field label="Which pet is this for?">
        {pets.length === 0 ? (
          <div style={{ padding: 12, borderRadius: 10, background: "var(--bg)", color: "var(--muted)", fontSize: 13 }}>
            You don't have any pets yet. Add a pet first to book an appointment.
          </div>
        ) : (
          <select style={inputStyle} value={petId} onChange={(e) => setPetId(e.target.value)}>{pets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        )}
      </Field>
      <Field label="Consultation type"><div style={{ display: "flex", gap: 8 }}>
        {vet.inPerson && <button onClick={() => setMode("In-person")} style={pillBtn(mode === "In-person")}><Building2 size={15} /> In-person</button>}
        {vet.online && <button onClick={() => setMode("Online")} style={pillBtn(mode === "Online")}><Video size={15} /> Online</button>}
      </div></Field>
      <Field label="Choose a day"><div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
        {nextDays.map((d, i) => { const has = (availability?.[d.getDay()] || []).length > 0; return <button key={i} onClick={() => { setDayIdx(i); setTime(null); }} style={{ ...pillBtn(dayIdx === i), flexDirection: "column", minWidth: 60, padding: "8px 10px", gap: 2, opacity: has ? 1 : .55 }}><span style={{ fontSize: 11, opacity: .75 }}>{d.toLocaleDateString("en-IN", { weekday: "short" })}</span><span style={{ fontWeight: 700 }}>{d.getDate()}</span>{!has && <span style={{ fontSize: 9 }}>No slots</span>}</button>; })}
      </div></Field>
      <Field label="Choose a slot">{availableSlots.length === 0 ? <div style={{ padding: 14, borderRadius: 10, background: "var(--bg)", color: "var(--muted)", fontSize: 13 }}>This veterinarian has not selected any slots for this day. Please choose another day.</div> : <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>{availableSlots.map((t) => <button key={t} onClick={() => setTime(t)} style={pillBtn(time === t)}>{t}</button>)}</div>}</Field>
      <div style={{ background: "var(--bg)", borderRadius: 10, padding: 12, fontSize: 13, marginTop: 6, marginBottom: 14 }}><strong>{pet?.name}</strong> with <strong>{vet.name}</strong> · {fmtDate(selectedDate)}{time ? ", " + time : ""} · {mode} · ₹{vet.fee}</div>
      <Btn style={{ width: "100%" }} size="lg" disabled={!time || !pet} onClick={() => onConfirm({ vet, pet, date: selectedDate.toISOString().split("T")[0], time, mode })}>Confirm booking</Btn>
    </Modal>
  );
}

function pillBtn(active) {
  return {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 12px",
    borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer",
    border: active ? "1.5px solid var(--primary)" : "1px solid var(--line)",
    background: active ? "var(--primary-tint)" : "#fff", color: active ? "var(--primary)" : "var(--ink)",
  };
}

function RescheduleModal({ appt, availability, onClose, onConfirm }) {
  const [dayIdx, setDayIdx] = useState(0); const [time, setTime] = useState(null);
  const selectedDate = nextDays[dayIdx]; const availableSlots = sortSlots(availability?.[selectedDate.getDay()] || []);
  return <Modal title={"Reschedule with " + appt.vetName} onClose={onClose} width={480}>
    <Field label="Choose a new day"><div style={{ display: "flex", gap: 8, overflowX: "auto" }}>{nextDays.map((d,i)=>{const has=(availability?.[d.getDay()]||[]).length>0; return <button key={i} onClick={()=>{setDayIdx(i);setTime(null);}} style={{...pillBtn(dayIdx===i),flexDirection:"column",minWidth:60,padding:"8px 10px",gap:2,opacity:has?1:.55}}><span style={{fontSize:11,opacity:.75}}>{d.toLocaleDateString("en-IN",{weekday:"short"})}</span><span style={{fontWeight:700}}>{d.getDate()}</span>{!has&&<span style={{fontSize:9}}>No slots</span>}</button>})}</div></Field>
    <Field label="Choose a new slot">{availableSlots.length===0?<div style={{padding:14,borderRadius:10,background:"var(--bg)",color:"var(--muted)",fontSize:13}}>This veterinarian has not selected any slots for this day. Please choose another day.</div>:<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>{availableSlots.map(t=><button key={t} onClick={()=>setTime(t)} style={pillBtn(time===t)}>{t}</button>)}</div>}</Field>
    <Btn style={{width:"100%",marginTop:8}} size="lg" disabled={!time} onClick={()=>onConfirm(selectedDate.toISOString().split("T")[0],time)}>Confirm new time</Btn>
  </Modal>;
}

/* ---------------------------------------------------------------
   OWNER: APPOINTMENTS
---------------------------------------------------------------- */

function OwnerAppointments({ appointments, onCancel, onReschedule, setPage }) {
  const [tab, setTab] = useState("upcoming");
  const now = new Date();
  const filtered = appointments.filter((a) => {
    const state = getAppointmentState(a, now);
    return tab === "upcoming"
      ? state === "upcoming" || state === "passed"
      : state !== "upcoming" && state !== "passed";
  });

  return (
    <div>
      <PageHeader title="Appointments" subtitle="Manage upcoming visits and browse your history." action={<Btn icon={Plus} onClick={() => setPage("owner-vets")}>Book new</Btn>} />
      <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
        {["upcoming", "history"].map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "9px 16px", borderRadius: 9, fontSize: 13.5, fontWeight: 600, cursor: "pointer", textTransform: "capitalize", border: tab === t ? "1.5px solid var(--primary)" : "1px solid var(--line)", background: tab === t ? "var(--primary-tint)" : "#fff", color: tab === t ? "var(--primary)" : "var(--ink)" }}>{t}</button>
        ))}
      </div>
      <Panel noPad>
        {filtered.length === 0 && <div style={{ padding: 30 }}><EmptyNote text={`No ${tab} appointments.`} /></div>}
        {filtered.map((a, i) => {
          const displayStatus = getAppointmentState(a, now);
          return (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", borderBottom: i < filtered.length - 1 ? "1px solid var(--line)" : "none", flexWrap: "wrap" }}>
              <Avatar label={a.vetName} size={44} />
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{a.vetName}</div>
                <div style={{ color: "var(--muted)", fontSize: 13 }}>{a.petName} · {a.date}, {a.time} · {a.mode}</div>
              </div>
              <Badge tone={displayStatus === "upcoming" ? "primary" : displayStatus === "completed" ? "success" : displayStatus === "in_process" ? "primary" : "alert"}>{appointmentStatusLabel(displayStatus)}</Badge>
              {displayStatus === "upcoming" && (
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn size="sm" variant="outline" onClick={() => onReschedule(a)}>Reschedule</Btn>
                  <Btn size="sm" variant="danger" onClick={() => onCancel(a.id)}>Cancel</Btn>
                </div>
              )}
            </div>
          );
        })}
      </Panel>
    </div>
  );
}

/* ---------------------------------------------------------------
   OWNER: REMINDERS
---------------------------------------------------------------- */

function OwnerReminders({ reminders, appointments, onMarkDone }) {
  const icons = { vaccination: ShieldCheck, medicine: Pill, grooming: Activity, checkup: Stethoscope };

  // Keep the Reminders page as the single place for all upcoming care items.
  // Regular reminders come from the reminders table, while scheduled appointments
  // are read from the live appointments state and shown alongside them.
  const appointmentItems = (appointments || [])
    .filter((appointment) => appointmentIsUpcoming(appointment))
    .map((appointment) => ({
      kind: "appointment",
      id: `appointment-${appointment.id}`,
      appointmentId: appointment.id,
      petName: appointment.petName,
      vetName: appointment.vetName,
      date: appointment.date,
      time: appointment.time,
      mode: appointment.mode,
    }));

  const reminderItems = (reminders || []).map((reminder) => ({
    kind: "reminder",
    ...reminder,
  }));

  const allItems = [...reminderItems, ...appointmentItems].sort((a, b) => {
    if (a.kind === "reminder" && b.kind === "reminder") return a.id - b.id;
    if (a.kind === "appointment" && b.kind === "appointment") {
      return `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`);
    }
    return a.kind === "appointment" ? -1 : 1;
  });

  return (
    <div>
      <PageHeader
        title="Reminders"
        subtitle="All upcoming care reminders and scheduled appointments for your pets in one place."
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {allItems.length === 0 && (
          <Panel>
            <EmptyNote text="No upcoming reminders or scheduled appointments." />
          </Panel>
        )}

        {allItems.map((item) => {
          if (item.kind === "appointment") {
            return (
              <Panel key={item.id} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 11, background: "var(--primary-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Calendar size={19} color="var(--primary)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>
                    {item.petName}'s appointment with {item.vetName}
                  </div>
                  <div style={{ color: "var(--muted)", fontSize: 13 }}>
                    📅 {item.date} at {item.time} · {item.mode}
                  </div>
                </div>
                <Badge tone="primary">Scheduled</Badge>
              </Panel>
            );
          }

          const Icon = icons[item.tag] || Bell;
          return (
            <Panel key={item.id} style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 11, background: "var(--accent-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={19} color="#8A5A16" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{item.petName}'s {item.type.toLowerCase()}</div>
                <div style={{ color: "var(--muted)", fontSize: 13 }}>🔔 Due {item.due.toLowerCase()}</div>
              </div>
              <Btn size="sm" variant="outline" onClick={() => onMarkDone(item.id)}>
                Mark done
              </Btn>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   OWNER: SHOP / CART / ORDERS
---------------------------------------------------------------- */

function Shop({
  products,
  onAdd,
  cartCount,
  onCart,
  orders,
  onOrderAgain,
}) {
  const [showOrders, setShowOrders] = useState(false);
  const [cat, setCat] = useState("All");
  const [query, setQuery] = useState("");
  const filtered = products.filter((p) => (cat === "All" || p.category === cat) && p.name.toLowerCase().includes(query.toLowerCase()));
  return (
    <div>
      <PageHeader title="Shop pet essentials" subtitle="Food, toys, grooming, accessories, and medicine — delivered to your door."
        action={
          <div style={{ display: "flex", gap: 8 }}>
            <Btn
              variant="outline"
              onClick={() => setShowOrders(true)}
            >
              Previous orders
            </Btn>

            <Btn variant="outline" icon={ShoppingBag} onClick={onCart}>Cart {cartCount > 0 ? `(${cartCount})` : ""}</Btn>
          </div>
        } />
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: 12, color: "var(--muted)" }} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products" style={{ ...inputStyle, paddingLeft: 34 }} />
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {productCategories.map((c) => (
            <button key={c} onClick={() => setCat(c)} style={{
              padding: "9px 13px", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer",
              border: cat === c ? "1.5px solid var(--primary)" : "1px solid var(--line)",
              background: cat === c ? "var(--primary-tint)" : "#fff", color: cat === c ? "var(--primary)" : "var(--ink)",
            }}>{c}</button>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {filtered.map((p) => (
          <Panel key={p.id} style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ height: 90, borderRadius: 10, background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <Package size={30} color={colorFor(p.name)} />
            </div>
            <Badge>{p.category}</Badge>
            <div style={{ fontWeight: 600, fontSize: 14, margin: "8px 0 4px", lineHeight: 1.3 }}>{p.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12.5, color: "var(--muted)", marginBottom: 12 }}>
              <Star size={12} fill="var(--accent)" color="var(--accent)" /> {p.rating}
            </div>
            <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 17 }}>₹{p.price}</span>
              <Btn size="sm" onClick={() => onAdd(p.id)}>Add</Btn>
            </div>
          </Panel>
        ))}
      </div>

      {showOrders && (
        <PreviousOrdersModal
          orders={orders}
          products={products}
          onClose={() => setShowOrders(false)}
          onOrderAgain={(order) => {
            onOrderAgain(order);
            setShowOrders(false);
          }}
        />
      )}
    </div>
  );
}

function PreviousOrdersModal({
  orders,
  products,
  onClose,
  onOrderAgain,
}) {
  return (
    <Modal
      title="Previous orders"
      onClose={onClose}
      width={620}
    >
      {orders.length === 0 ? (
        <EmptyNote text="You have no previous orders." />
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {orders.map((order) => (
            <div
              key={order.id}
              style={{
                border: "1px solid var(--line)",
                borderRadius: 12,
                padding: 14,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 10,
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    Order {order.orderNumber || `ORD${order.id}`}
                  </div>

                  <div
                    style={{
                      color: "var(--muted)",
                      fontSize: 12.5,
                      marginTop: 3,
                    }}
                  >
                    {order.date} · {order.items} item
                    {order.items !== 1 ? "s" : ""}
                  </div>
                </div>

                <Badge
                  tone={
                    order.status === "Delivered"
                      ? "success"
                      : "primary"
                  }
                >
                  {order.status}
                </Badge>
              </div>

              {order.products &&
                order.products.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      marginBottom: 12,
                    }}
                  >
                    {order.products.map((item) => {
                      const product = products.find(
                        (p) => String(p.id) === String(item.productId)
                      );

                      const productName =
                        item.name || product?.name || "Product";

                      return (
                        <div
                          key={item.productId}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: 13,
                          }}
                        >
                          <span>
                            {productName}
                          </span>

                          <span
                            style={{
                              color: "var(--muted)",
                            }}
                          >
                            × {item.qty}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingTop: 10,
                  borderTop:
                    "1px solid var(--line)",
                }}
              >
                <strong>
                  ₹{order.total}
                </strong>

                <Btn
                  size="sm"
                  onClick={() =>
                    onOrderAgain(order)
                  }
                >
                  Order again
                </Btn>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

function CartPage({ cart, products, onQty, onRemove, onCheckout, setPage }) {
  const items = cart
    .map((i) => ({
      ...i,
      product: products.find((p) => p.id === i.productId),
    }))
    .filter((i) => i.product);
  const total = items.reduce((s, i) => s + i.product.price * i.qty, 0);

  if (items.length === 0) {
    return (
      <div>
        <PageHeader title="Your cart" />
        <Panel style={{ textAlign: "center", padding: 50 }}>
          <ShoppingBag size={30} color="var(--muted)" style={{ marginBottom: 10 }} />
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Your cart is empty</div>
          <div style={{ color: "var(--muted)", fontSize: 13.5, marginBottom: 16 }}>Add food, toys, or grooming products to get started.</div>
          <Btn onClick={() => setPage("owner-shop")}>Go to shop</Btn>
        </Panel>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Your cart" subtitle={`${items.length} item${items.length !== 1 ? "s" : ""} ready for checkout.`} />
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((i) => (
            <Panel key={i.productId} style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 54, height: 54, borderRadius: 10, background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Package size={22} color={colorFor(i.product.name)} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{i.product.name}</div>
                <div style={{ color: "var(--muted)", fontSize: 12.5 }}>₹{i.product.price} each</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => onQty(i.productId, -1)} style={qtyBtnStyle}>−</button>
                <span style={{ minWidth: 18, textAlign: "center", fontWeight: 600 }}>{i.qty}</span>
                <button onClick={() => onQty(i.productId, 1)} style={qtyBtnStyle}>+</button>
              </div>
              <div style={{ fontWeight: 600, minWidth: 60, textAlign: "right" }}>₹{i.product.price * i.qty}</div>
              <button onClick={() => onRemove(i.productId)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--alert)" }}>
                <Trash2 size={16} />
              </button>
            </Panel>
          ))}
        </div>
        <Panel style={{ alignSelf: "start" }}>
          <SectionTitle title="Order summary" />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 8 }}><span>Subtotal</span><span>₹{total}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 14, color: "var(--muted)" }}><span>Delivery</span><span>Free</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 17, paddingTop: 12, borderTop: "1px solid var(--line)", marginBottom: 16 }}>
            <span>Total</span><span>₹{total}</span>
          </div>
          <Btn style={{ width: "100%" }} size="lg" onClick={() => onCheckout(total)}>Place order</Btn>
        </Panel>
      </div>
    </div>
  );
}

const qtyBtnStyle = { width: 26, height: 26, borderRadius: 7, border: "1px solid var(--line)", background: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 15, lineHeight: "24px" };

function OrdersPage({ orders, setPage }) {
  return (
    <div>
      <PageHeader title="Order history" subtitle="Track your past and current orders." action={<Btn variant="outline" onClick={() => setPage("owner-shop")}>Continue shopping</Btn>} />
      {orders.length === 0 ? (
        <Panel style={{ textAlign: "center", padding: 40 }}><EmptyNote text="No orders yet." /></Panel>
      ) : (
        <Panel noPad>
          {orders.map((o, i) => (
            <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", borderBottom: i < orders.length - 1 ? "1px solid var(--line)" : "none", flexWrap: "wrap" }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: "var(--primary-tint)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Package size={18} color="var(--primary)" />
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontWeight: 600, fontSize: 14.5 }}>Order {o.id}</div>
                <div style={{ color: "var(--muted)", fontSize: 12.5 }}>{o.items} items · {o.date}</div>
              </div>
              <div style={{ fontWeight: 600 }}>₹{o.total}</div>
              <Badge tone={o.status === "Delivered" ? "success" : "primary"}>{o.status}</Badge>
            </div>
          ))}
        </Panel>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------
   OWNER: AI ASSISTANT
---------------------------------------------------------------- */

function AiAssistant({ chat, onSend, pets }) {
  const [input, setInput] = useState("");
  const suggestions = ["My dog is scratching a lot lately", "What should I feed a 3-year-old Labrador?", "How often should I groom a cat?", "Is it time for my pet's vaccination?"];
  return (
    <div>
      <PageHeader title="AI pet-care assistant" subtitle="General guidance on symptoms, diet, and routines. Not a substitute for veterinary advice." />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 20 }}>
        <Panel noPad style={{ display: "flex", flexDirection: "column", height: 520 }}>
          <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
            {chat.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "78%", padding: "10px 14px", borderRadius: 14, fontSize: 14, lineHeight: 1.5,
                  background: m.role === "user" ? "var(--primary)" : "var(--bg)",
                  color: m.role === "user" ? "#fff" : "var(--ink)",
                  borderBottomRightRadius: m.role === "user" ? 4 : 14, borderBottomLeftRadius: m.role === "ai" ? 4 : 14,
                }}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: 14, borderTop: "1px solid var(--line)", display: "flex", gap: 8 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { onSend(input); setInput(""); } }}
              placeholder="Describe what's going on with your pet..."
              style={{ ...inputStyle, flex: 1 }}
            />
            <Btn icon={Send} onClick={() => { onSend(input); setInput(""); }}>Send</Btn>
          </div>
        </Panel>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Panel>
            <SectionTitle title="Try asking" />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {suggestions.map((s) => (
                <button key={s} onClick={() => onSend(s)} style={{ textAlign: "left", background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 9, padding: "9px 11px", fontSize: 12.5, cursor: "pointer" }}>
                  {s}
                </button>
              ))}
            </div>
          </Panel>
          <Panel>
            <SectionTitle title="Care schedule" />
            <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
              AI-suggested daily routine for {pets[0]?.name}: two meals, 30 min walk, 10 min play, evening brush.
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   OWNER: EMERGENCY
---------------------------------------------------------------- */

function Emergency({ clinics = [] }) {
  return (
    <div>
      <PageHeader title="Emergency help" subtitle="Find the nearest veterinary help right away." />
      <Panel style={{ background: "var(--alert-tint)", border: "1px solid #EAC3B2", marginBottom: 20, display: "flex", alignItems: "center", gap: 14 }}>
        <AlertTriangle size={24} color="var(--alert)" />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: "var(--alert)" }}>In a critical emergency, call the nearest clinic directly.</div>
          <div style={{ fontSize: 13, color: "#8A4530" }}>Use the live clinic directory below for urgent care.</div>
        </div>
      </Panel>
      {clinics.length === 0 ? <EmptyNote text="No emergency clinics are currently listed." /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {clinics.map((c) => (
            <Panel key={c.id} style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: "var(--alert-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Building2 size={20} color="var(--alert)" />
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: 15.5 }}>{c.name}</div>
                  {c.open24 && <Badge tone="success">Open 24x7</Badge>}
                </div>
                <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 3, display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={13} /> {c.address}{c.distance ? ` · ${c.distance}` : ""}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {c.address && <Btn size="sm" variant="outline" icon={MapPin} onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.address)}`, "_blank")}>Directions</Btn>}
                {c.phone && <Btn size="sm" icon={Phone} onClick={() => window.location.href = `tel:${c.phone}`}>{c.phone}</Btn>}
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------
   VET DASHBOARD
---------------------------------------------------------------- */


function VetHome({ appointments, pets, vetName, onOpenPatient, onNavigate }) {
  const now = new Date();
  const upcoming = appointments.filter((a) => getAppointmentState(a, now) === "upcoming");
  const completed = appointments.filter((a) => getAppointmentState(a, now) === "completed");

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayAppointments = upcoming.filter((a) => {
    const rawDate = String(a.date || "");
    return rawDate === todayKey || rawDate.includes(todayKey);
  });

  const displayAppointments =
    todayAppointments.length > 0 ? todayAppointments : upcoming.slice(0, 4);

  return (
    <div>
      <PageHeader
        eyebrow={vetName || "Veterinarian"}
        title="Veterinarian dashboard"
        subtitle="A quick overview of your schedule, patients, and recent activity."
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <StatCard
          icon={CalendarClock}
          label="Upcoming visits"
          value={upcoming.length}
          tone="primary"
        />
        <StatCard
          icon={Check}
          label="Completed visits"
          value={completed.length}
        />
        <StatCard
          icon={Users}
          label="Patients"
          value={pets.length}
          tone="accent"
        />
        <StatCard
          icon={Clock}
          label="Available slots"
          value="Set in My Slots"
          tone="primary"
          onClick={() => onNavigate("vet-availability")}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr",
          gap: 20,
          marginBottom: 20,
        }}
      >
        <Panel>
          <SectionTitle
            title={todayAppointments.length > 0 ? "Today's appointments" : "Upcoming appointments"}
            action={
              <button
                type="button"
                onClick={() => onNavigate("vet-appointments")}
                style={{
                  border: 0,
                  background: "transparent",
                  color: "var(--primary)",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                View schedule
              </button>
            }
          />

          {displayAppointments.length === 0 ? (
            <EmptyNote text="You have no upcoming appointments." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {displayAppointments.map((a) => (
                <div key={a.id} style={rowStyle}>
                  <Avatar label={a.petName} size={42} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{a.petName}</div>
                    <div style={{ color: "var(--muted)", fontSize: 12.5 }}>
                      {a.date}, {a.time} · {a.mode}
                    </div>
                  </div>
                  <Btn
                    size="sm"
                    variant="outline"
                    onClick={() => onOpenPatient(a.petId)}
                  >
                    View patient
                  </Btn>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel>
          <SectionTitle title="Patient snapshot" />
          {pets.length === 0 ? (
            <EmptyNote text="No patients yet." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {pets.slice(0, 5).map((p) => {
                const visits = appointments.filter(
                  (a) => a.petId === p.id && a.status === "completed"
                ).length;

                return (
                  <div
                    key={p.id}
                    onClick={() => onOpenPatient(p.id)}
                    style={{ ...rowStyle, cursor: "pointer" }}
                  >
                    <Avatar label={p.name} size={38} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div style={{ color: "var(--muted)", fontSize: 12 }}>
                        {visits} completed visit{visits !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <ChevronRight size={16} color="var(--muted)" />
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>

      <Panel>
        <SectionTitle title="Quick actions" />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Btn
            onClick={() => onNavigate("vet-appointments")}
          >
            View appointments
          </Btn>
          <Btn
            variant="outline"
            onClick={() => onNavigate("vet-patients")}
          >
            View patients
          </Btn>
          <Btn
            variant="outline"
            onClick={() => onNavigate("vet-profile")}
          >
            Edit profile
          </Btn>
        </div>
      </Panel>
    </div>
  );
}

function VetAppointments({ appointments, pets, vetName, onUpdate, onOpenPatient, onNavigate }) {
  const [tab, setTab] = useState("upcoming");
  const now = new Date();
  const upcoming = appointments.filter((a) => getAppointmentState(a, now) === "upcoming");
  const completed = appointments.filter((a) => getAppointmentState(a, now) === "completed");
  const filtered = tab === "upcoming"
    ? appointments.filter((a) => ["upcoming", "passed", "in_process"].includes(getAppointmentState(a, now)))
    : appointments.filter((a) => !["upcoming", "passed", "in_process"].includes(getAppointmentState(a, now)));

  return (
    <div>
      <PageHeader eyebrow={vetName || "Veterinarian"} title="Appointments" subtitle="Manage your schedule, review patients, and keep track of appointment status." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        <StatCard icon={CalendarClock} label="Upcoming visits" value={upcoming.length} tone="primary" />
        <StatCard icon={Check} label="Completed visits" value={completed.length} />
        <StatCard icon={Users} label="Patients" value={pets.length} tone="accent" />
        <StatCard icon={Clock} label="Available slots" value="See My Slots" tone="primary" onClick={() => onNavigate("vet-availability")} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20, marginBottom: 20 }}>
        <Panel>
          <SectionTitle title="Today's workload" />
          {appointments.filter((a) => getAppointmentState(a, now) === "upcoming").length === 0 ? (
            <EmptyNote text="You have no upcoming appointments." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {appointments.filter((a) => getAppointmentState(a, now) === "upcoming").slice(0, 3).map((a) => (
                <div key={a.id} style={rowStyle}>
                  <Avatar label={a.petName} size={42} />
                  <div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>{a.petName}</div><div style={{ color: "var(--muted)", fontSize: 12.5 }}>{a.time} · {a.mode}</div></div>
                  <Btn size="sm" variant="outline" onClick={() => onOpenPatient(a.petId)}>View patient</Btn>
                </div>
              ))}
            </div>
          )}
        </Panel>
        <Panel>
          <SectionTitle title="Patient snapshot" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pets.slice(0, 4).map((p) => {
              const visits = appointments.filter((a) => a.petId === p.id && getAppointmentState(a, now) === "completed").length;
              return <div key={p.id} onClick={() => onOpenPatient(p.id)} style={{ ...rowStyle, cursor: "pointer" }}><Avatar label={p.name} size={38} /><div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>{p.name}</div><div style={{ color: "var(--muted)", fontSize: 12 }}>{visits} visit{visits !== 1 ? "s" : ""}</div></div><ChevronRight size={16} color="var(--muted)" /></div>;
            })}
          </div>
        </Panel>
      </div>
      <Panel noPad>
        <div style={{ padding: "18px 20px 0" }}>
          <SectionTitle title="Appointments" />
          <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
            {["upcoming", "history"].map((t) => <button key={t} onClick={() => setTab(t)} style={{ padding: "9px 16px", borderRadius: 9, fontSize: 13.5, fontWeight: 600, cursor: "pointer", textTransform: "capitalize", border: tab === t ? "1.5px solid var(--primary)" : "1px solid var(--line)", background: tab === t ? "var(--primary-tint)" : "#fff", color: tab === t ? "var(--primary)" : "var(--ink)" }}>{t}</button>)}
          </div>
        </div>
        {filtered.length === 0 && <div style={{ padding: 30 }}><EmptyNote text={`No ${tab} appointments.`} /></div>}
        {filtered.map((a) => {
          const state = getAppointmentState(a, now);
          const start = parseAppointmentDateTime({ appointment_date: a.appointmentDate, appointment_time: a.time });
          const bufferEnd = start ? new Date(start.getTime() + APPOINTMENT_BUFFER_MINUTES * 60 * 1000) : null;
          const inBuffer = state === "passed";
          const canStart = inBuffer && a.status === "upcoming";
          const canCompleteOnly = a.status === "in_process";
          return (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", borderTop: "1px solid var(--line)", flexWrap: "wrap" }}>
              <Avatar label={a.petName} size={44} />
              <div style={{ flex: 1, minWidth: 180 }}><div style={{ fontWeight: 600, fontSize: 15 }}>{a.petName}</div><div style={{ color: "var(--muted)", fontSize: 13 }}>{a.date}, {a.time} · {a.mode}</div>{inBuffer && bufferEnd && <div style={{ color: "var(--muted)", fontSize: 11.5, marginTop: 3 }}>30-minute buffer is active</div>}</div>
              <Badge tone={state === "completed" ? "success" : state === "upcoming" || state === "in_process" ? "primary" : "alert"}>{appointmentStatusLabel(state)}</Badge>
              <Btn size="sm" variant="outline" onClick={() => onOpenPatient(a.petId)}>View patient</Btn>
              {canStart && <Btn size="sm" onClick={() => onUpdate(a.id, "in_process")}>In Process</Btn>}
              {canStart && <Btn size="sm" variant="danger" onClick={() => onUpdate(a.id, "not_held")}>Not Held</Btn>}
              {(canStart || canCompleteOnly) && <Btn size="sm" onClick={() => onUpdate(a.id, "completed")}>Completed</Btn>}
            </div>
          );
        })}
      </Panel>
    </div>
  );
}

function VetPatients({ pets, appointments, onOpen }) {
  function visitCount(petId) {
    return appointments.filter(
      (a) => a.petId === petId && a.status === "completed"
    ).length;
  }

  return (
    <div>
      <PageHeader title="Patients" subtitle="Pet profiles and medical history for animals under your care." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {pets.map((p) => {
          const visits = visitCount(p.id);
          return (
            <Panel key={p.id} style={{ cursor: "pointer" }} noPad>
              <div onClick={() => onOpen(p)} style={{ padding: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <Avatar label={p.name} size={46} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ color: "var(--muted)", fontSize: 12.5 }}>{p.breed}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <Badge tone="primary">{visits} visit{visits !== 1 ? "s" : ""}</Badge>
                  <Badge tone="accent">{p.vaccinations.filter((v) => v.status !== "done").length} due</Badge>
                </div>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

function VetAvailability({ onSaved }) {
  const [loading, setLoading] = useState(true);
  const [savingDay, setSavingDay] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [myVetId, setMyVetId] = useState(null);
  const [selected, setSelected] = useState(() => Object.fromEntries(availabilityWeekdays.map((d) => [d.value, []])));

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (mounted) setLoading(false); return; }
      const { data: vet, error: vetError } = await supabase.from("veterinarians").select("id").eq("profile_id", user.id).maybeSingle();
      if (vetError || !vet) { if (mounted) { setError(vetError?.message || "Your veterinarian profile could not be found."); setLoading(false); } return; }
      const { data, error: availabilityError } = await supabase.from("vet_availability").select("day_of_week, slot_time").eq("vet_id", vet.id).order("day_of_week").order("slot_time");
      if (!mounted) return;
      if (availabilityError) setError(availabilityError.message);
      else {
        const next = Object.fromEntries(availabilityWeekdays.map((d) => [d.value, []]));
        (data || []).forEach((row) => { if (!next[row.day_of_week]) next[row.day_of_week] = []; next[row.day_of_week].push(row.slot_time); });
        Object.keys(next).forEach((day) => { next[day] = sortSlots(next[day]); });
        setSelected(next);
      }
      setMyVetId(vet.id); setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  function toggleSlot(day, slot) { setSelected((current) => ({ ...current, [day]: (current[day] || []).includes(slot) ? current[day].filter((s) => s !== slot) : [...(current[day] || []), slot] })); setSuccess(""); }

  async function saveDay(day) {
    if (!myVetId) return;
    setSavingDay(day); setError(""); setSuccess("");
    const { error: deleteError } = await supabase.from("vet_availability").delete().eq("vet_id", myVetId).eq("day_of_week", day);
    if (deleteError) { setError(deleteError.message); setSavingDay(null); return; }
    const rows = (selected[day] || []).map((slot_time) => ({ vet_id: myVetId, day_of_week: day, slot_time }));
    if (rows.length) { const { error: insertError } = await supabase.from("vet_availability").insert(rows); if (insertError) { setError(insertError.message); setSavingDay(null); return; } }
    setSavingDay(null); setSuccess("Availability saved. Pet owners will see these slots when booking."); if (onSaved) await onSaved();
  }

  if (loading) return <div><PageHeader title="My slots" subtitle="Choose the days and times when pet owners can book you." /><Panel style={{padding:24,color:"var(--muted)"}}>Loading your availability…</Panel></div>;
  return <div>
    <PageHeader title="My slots" subtitle="Choose the days and times when pet owners can book you." />
    <Panel style={{marginBottom:18}}><SectionTitle title="Set your availability" /><div style={{color:"var(--muted)",fontSize:13.5,lineHeight:1.6}}>Select the appointment times you offer on each day, then save that day. Pet owners will only see the slots you select.</div></Panel>
    {error && <Panel style={{marginBottom:18,color:"var(--alert)",background:"var(--alert-tint)"}}>{error}</Panel>}
    {success && <Panel style={{marginBottom:18,color:"var(--primary)",background:"var(--primary-tint)"}}>{success}</Panel>}
    <div style={{display:"flex",flexDirection:"column",gap:12}}>{availabilityWeekdays.map((day)=><Panel key={day.value}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:14,marginBottom:14,flexWrap:"wrap"}}><div><div style={{fontWeight:700,fontSize:16}}>{day.label}</div><div style={{color:"var(--muted)",fontSize:12.5}}>{(selected[day.value]||[]).length} slot{(selected[day.value]||[]).length!==1?"s":""} selected</div></div><Btn size="sm" onClick={()=>saveDay(day.value)} disabled={savingDay===day.value}>{savingDay===day.value?"Saving…":"Save day"}</Btn></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(120px,1fr))",gap:8}}>{availabilityTimeOptions.map((slot)=><button key={slot} type="button" onClick={()=>toggleSlot(day.value,slot)} style={pillBtn((selected[day.value]||[]).includes(slot))}>{slot}</button>)}</div>
    </Panel>)}</div>
  </div>;
}

function VetProfile({ onSaved }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    specialty: "",
    experience: "",
    location: "",
    fee: "",
    online: true,
    inPerson: true,
  });

  useEffect(() => {
    let mounted = true;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (mounted) setLoading(false);
        return;
      }

      const { data, error: loadError } = await supabase
        .from("veterinarians")
        .select("specialty, experience, location, fee, online, in_person")
        .eq("profile_id", user.id)
        .maybeSingle();

      if (!mounted) return;

      if (loadError) {
        setError("Could not load your profile. Please refresh and try again.");
      } else if (data) {
        setForm({
          specialty: data.specialty || "",
          experience: data.experience || "",
          location: data.location || "",
          fee: data.fee != null ? String(data.fee) : "",
          online: data.online ?? true,
          inPerson: data.in_person ?? true,
        });
      }

      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setSuccess("");
  };

  const canSave =
    form.specialty.trim() &&
    form.location.trim() &&
    form.fee !== "" &&
    (form.online || form.inPerson);

  async function handleSave() {
    if (!canSave) return;

    setSaving(true);
    setError("");
    setSuccess("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You need to be logged in to update your profile.");
      setSaving(false);
      return;
    }

    const { error: saveError } = await supabase
      .from("veterinarians")
      .update({
        specialty: form.specialty.trim(),
        experience: form.experience.trim(),
        location: form.location.trim(),
        fee: Number(form.fee) || 0,
        online: form.online,
        in_person: form.inPerson,
      })
      .eq("profile_id", user.id);

    setSaving(false);

    if (saveError) {
      setError(saveError.message);
      return;
    }

    setSuccess("Your profile has been updated. Pet owners will see the new details right away.");
    if (onSaved) await onSaved();
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="My profile" subtitle="Update what pet owners see when they search for a vet." />
        <Panel style={{ padding: 24, color: "var(--muted)" }}>Loading your profile…</Panel>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="My profile" subtitle="Update what pet owners see when they search for a vet." />
      <Panel style={{ padding: 24, maxWidth: 560 }}>
        <Field label="Specialty">
          <input
            style={inputStyle}
            value={form.specialty}
            onChange={set("specialty")}
            placeholder="e.g. General & Preventive Care"
          />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Experience">
            <input
              style={inputStyle}
              value={form.experience}
              onChange={set("experience")}
              placeholder="e.g. 8 yrs"
            />
          </Field>

          <Field label="Consultation fee (₹)">
            <input
              style={inputStyle}
              type="number"
              min="0"
              value={form.fee}
              onChange={set("fee")}
              placeholder="e.g. 500"
            />
          </Field>
        </div>

        <Field label="Location">
          <input
            style={inputStyle}
            value={form.location}
            onChange={set("location")}
            placeholder="e.g. Alkapuri, Vadodara (or 'Online only')"
          />
        </Field>

        <Field label="Available for">
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => {
                setForm((f) => ({ ...f, online: !f.online }));
                setSuccess("");
              }}
              style={pillBtn(form.online)}
            >
              Online
            </button>

            <button
              type="button"
              onClick={() => {
                setForm((f) => ({ ...f, inPerson: !f.inPerson }));
                setSuccess("");
              }}
              style={pillBtn(form.inPerson)}
            >
              In-person
            </button>
          </div>

          {!form.online && !form.inPerson && (
            <div style={{ color: "var(--alert)", fontSize: 12.5, marginTop: 8 }}>
              Select at least one consultation mode.
            </div>
          )}
        </Field>

        {error && (
          <div style={{ color: "var(--alert)", fontSize: 13.5, marginBottom: 12 }}>{error}</div>
        )}
        {success && (
          <div style={{ color: "var(--primary)", fontSize: 13.5, marginBottom: 12 }}>{success}</div>
        )}

        <Btn onClick={handleSave} disabled={!canSave || saving} size="lg" style={{ width: "100%" }}>
          {saving ? "Saving…" : "Save profile"}
        </Btn>
      </Panel>
    </div>
  );
}

/* ---------------------------------------------------------------
   ADMIN DASHBOARD
---------------------------------------------------------------- */

function AdminHome({ users = [], vets = [], orders = [], appointments = [] }) {
  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyRevenue = orders
    .filter((order) => { const d = new Date(order.createdAt); return d.getMonth() === currentMonth && d.getFullYear() === currentYear; })
    .reduce((sum, order) => sum + Number(order.total || 0), 0);

  const revenueByMonth = Array.from({ length: 6 }).map((_, index) => {
    const d = new Date(currentYear, currentMonth - (5 - index), 1);
    const revenue = orders
      .filter((order) => { const od = new Date(order.createdAt); return od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear(); })
      .reduce((sum, order) => sum + Number(order.total || 0), 0);
    return { month: d.toLocaleDateString("en-IN", { month: "short" }), revenue, appointments: appointments.filter((a) => { const ad = new Date(a.date); return ad.getMonth() === d.getMonth() && ad.getFullYear() === d.getFullYear(); }).length };
  });

  const productRevenue = totalRevenue;
  const appointmentCount = appointments.length;
  const totalActivity = productRevenue + appointmentCount;
  const pieData = totalActivity > 0 ? [
    { name: "Products", value: Math.round((productRevenue / totalActivity) * 100), color: "#E2A33B" },
    { name: "Appointments", value: Math.round((appointmentCount / totalActivity) * 100), color: "#1F4B43" },
  ] : [];

  return (
    <div>
      <PageHeader title="Platform overview" subtitle="Monitor activity, revenue, and engagement across Pawcare." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
        <StatCard icon={Users} label="Registered users" value={users.filter((u) => u.role !== "admin").length} />
        <StatCard icon={Stethoscope} label="Active veterinarians" value={vets.length} tone="primary" />
        <StatCard icon={DollarSign} label="Revenue this month" value={`₹${monthlyRevenue.toLocaleString("en-IN")}`} tone="accent" />
        <StatCard icon={MessageCircle} label="Total orders" value={orders.length} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20 }}>
        <Panel>
          <SectionTitle title="Revenue & appointments" />
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueByMonth}>
              <defs><linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1F4B43" stopOpacity={0.35} /><stop offset="100%" stopColor="#1F4B43" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid stroke="#E4E1D6" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#746F63" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#746F63" }} axisLine={false} tickLine={false} width={44} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E4E1D6", fontSize: 13 }} />
              <Area type="monotone" dataKey="revenue" stroke="#1F4B43" strokeWidth={2.5} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>
        <Panel>
          <SectionTitle title="Activity by source" />
          {pieData.length === 0 ? <EmptyNote text="No activity data yet." /> : <>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart><Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>{pieData.map((d) => <Cell key={d.name} fill={d.color} />)}</Pie><Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E4E1D6", fontSize: 13 }} /></PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>{pieData.map((d) => <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: d.color }} />{d.name} — {d.value}%</div>)}</div>
          </>}
        </Panel>
      </div>
    </div>
  );
}

function AdminTable({ columns, rows }) {
  return (
    <Panel noPad>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c} style={{ textAlign: "left", padding: "12px 18px", color: "var(--muted)", fontWeight: 600, fontSize: 12.5, borderBottom: "1px solid var(--line)", whiteSpace: "nowrap" }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ borderBottom: i < rows.length - 1 ? "1px solid var(--line)" : "none" }}>
                {r.map((cell, j) => <td key={j} style={{ padding: "13px 18px", whiteSpace: "nowrap" }}>{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function AdminUsers({ users = [], onRoleChange, onDelete }) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const nonAdmins = users.filter((u) => u.role !== "admin");
  const filteredUsers = nonAdmins.filter((u) => {
    if (filter === "owner") return u.role === "owner";
    if (filter === "vet") return u.role === "vet";
    return true;
  });

  return (
    <div>
      <PageHeader title="Users" subtitle="Manage every Pawcare account and its role." action={<Btn variant="outline" icon={Filter} size="sm" onClick={() => setFilterOpen((v) => !v)}>Filter</Btn>} />
      {filterOpen && (
        <Panel style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[['all','All'],['owner','Users'],['vet','Vets']].map(([value,label]) => (
              <button key={value} onClick={() => setFilter(value)} style={{ ...pillBtn(filter === value), padding: "8px 13px" }}>{label}</button>
            ))}
          </div>
        </Panel>
      )}
      <AdminTable
        columns={["Name", "Email", "Role", "Pets", "Joined", "Actions"]}
        rows={filteredUsers.map((u) => [
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Avatar label={u.name} size={30} />{u.name}</div>,
          u.email,
          <select value={u.role} onChange={(e) => onRoleChange?.(u.id, e.target.value)} style={{ ...inputStyle, width: 130, padding: "7px 9px" }}>
            <option value="owner">User</option><option value="vet">Vet</option><option value="admin">Admin</option>
          </select>,
          u.pets,
          u.joined,
          <Btn variant="outline" size="sm" onClick={() => onDelete?.(u.id)}>Delete</Btn>,
        ])}
      />
    </div>
  );
}

function AdminVets({ vets, onAdd, onEdit, onDelete }) {
  const [editing, setEditing] = useState(null);
  return (
    <div>
      <PageHeader title="Veterinarians" subtitle="All vets partnered with Pawcare." action={<Btn icon={Plus} size="sm" onClick={onAdd}>Add vet</Btn>} />
      <AdminTable columns={["Name", "Specialty", "Location", "Rating", "Fee", "Actions"]} rows={vets.map((v) => [
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Avatar label={v.name} size={30} />{v.name}</div>,
        v.specialty, v.location,
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Star size={12} fill="var(--accent)" color="var(--accent)" />{v.rating}</span>,
        "₹" + v.fee,
        <div style={{ display: "flex", gap: 6 }}><Btn variant="outline" size="sm" onClick={() => setEditing(v)}>Edit</Btn><Btn variant="outline" size="sm" onClick={() => onDelete?.(v.id)}>Delete</Btn></div>
      ])} />
      {editing && <EditVetModal vet={editing} onClose={() => setEditing(null)} onSave={async (updates) => { await onEdit?.(editing.id, updates); setEditing(null); }} />}
    </div>
  );
}

function EditVetModal({ vet, onClose, onSave }) {
  const [form, setForm] = useState({ specialty: vet.specialty || "", location: vet.location || "", fee: String(vet.fee ?? 0), experience: vet.experience || "", online: !!vet.online, inPerson: !!vet.inPerson });
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  return <Modal title="Edit veterinarian" onClose={onClose}>
    <Field label="Specialty"><input style={inputStyle} value={form.specialty} onChange={set("specialty")} /></Field>
    <Field label="Location"><input style={inputStyle} value={form.location} onChange={set("location")} /></Field>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}><Field label="Experience"><input style={inputStyle} value={form.experience} onChange={set("experience")} /></Field><Field label="Fee"><input style={inputStyle} type="number" value={form.fee} onChange={set("fee")} /></Field></div>
    <Field label="Consultation modes"><div style={{ display: "flex", gap: 8 }}><button onClick={() => setForm((f) => ({ ...f, online: !f.online }))} style={pillBtn(form.online)}>Online</button><button onClick={() => setForm((f) => ({ ...f, inPerson: !f.inPerson }))} style={pillBtn(form.inPerson)}>In-person</button></div></Field>
    <Btn size="lg" style={{ width: "100%" }} onClick={() => onSave({ specialty: form.specialty.trim(), location: form.location.trim(), fee: Number(form.fee) || 0, experience: form.experience.trim(), online: form.online, in_person: form.inPerson })}>Save changes</Btn>
  </Modal>;
}

function AddVetModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    name: "",
    specialty: "",
    location: "",
    fee: "",
    experience: "",
    online: true,
    inPerson: true,
  });

  const set = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = () => {
    if (
      !form.name ||
      !form.specialty ||
      !form.location ||
      !form.fee ||
      (!form.online && !form.inPerson)
    ) {
      return;
    }

    onAdd({
      ...form,
      fee: Number(form.fee),
      rating: 0,
      online: form.online,
      inPerson: form.inPerson,
    });
  };

  return (
    <Modal title="Add veterinarian" onClose={onClose}>
      <Field label="Name">
        <input
          style={inputStyle}
          value={form.name}
          onChange={set("name")}
          placeholder="e.g. Dr. Rahul Patel"
        />
      </Field>

      <Field label="Specialty">
        <input
          style={inputStyle}
          value={form.specialty}
          onChange={set("specialty")}
          placeholder="e.g. General & Preventive Care"
        />
      </Field>

      <Field label="Location">
        <input
          style={inputStyle}
          value={form.location}
          onChange={set("location")}
          placeholder="e.g. Alkapuri, Vadodara"
        />
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Experience">
          <input
            style={inputStyle}
            value={form.experience}
            onChange={set("experience")}
            placeholder="e.g. 8 yrs"
          />
        </Field>

        <Field label="Consultation fee">
          <input
            style={inputStyle}
            type="number"
            value={form.fee}
            onChange={set("fee")}
            placeholder="e.g. 500"
          />
        </Field>
      </div>

      <Field label="Consultation modes">
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() =>
              setForm((f) => ({ ...f, online: !f.online }))
            }
            style={pillBtn(form.online)}
          >
            Online
          </button>

          <button
            onClick={() =>
              setForm((f) => ({ ...f, inPerson: !f.inPerson }))
            }
            style={pillBtn(form.inPerson)}
          >
            In-person
          </button>
        </div>

        {!form.online && !form.inPerson && (
          <div style={{ color: "var(--alert)", fontSize: 12.5, marginTop: 8 }}>
            Select at least one consultation mode.
          </div>
        )}
      </Field>

      <Btn
        size="lg"
        style={{ width: "100%", marginTop: 8 }}
        disabled={
          !form.name ||
          !form.specialty ||
          !form.location ||
          !form.fee ||
          (!form.online && !form.inPerson)
        }
        onClick={submit}
      >
        Add veterinarian
      </Btn>
    </Modal>
  );
}

function AdminAppointments({ appointments }) {
  return (
    <div>
      <PageHeader title="Appointments" subtitle="All bookings across the platform." />
      <AdminTable
        columns={["Pet", "Vet", "Date", "Mode", "Status"]}
        rows={appointments.map((a) => [
          a.petName, a.vetName, `${a.date}, ${a.time}`, a.mode,
          <Badge tone={a.status === "upcoming" ? "primary" : a.status === "completed" ? "success" : "alert"}>{a.status}</Badge>,
        ])}
      />
    </div>
  );
}

function AdminProducts({ products, orders, onAdd, onUpdateOrder, onDeleteOrder, onEditProduct, onDeleteProduct }) {
  const [tab, setTab] = useState("products");
  const [editing, setEditing] = useState(null);
  const orderStatuses = ["Pending", "Delivered", "Cancelled"];
  return (
    <div>
      <PageHeader title="Products & orders" subtitle="Manage the pet-store catalog and track orders." action={<Btn icon={Plus} size="sm" onClick={onAdd}>Add product</Btn>} />
      <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>{["products", "orders"].map((t) => <button key={t} onClick={() => setTab(t)} style={{ padding: "9px 16px", borderRadius: 9, fontSize: 13.5, fontWeight: 600, cursor: "pointer", textTransform: "capitalize", border: tab === t ? "1.5px solid var(--primary)" : "1px solid var(--line)", background: tab === t ? "var(--primary-tint)" : "#fff", color: tab === t ? "var(--primary)" : "var(--ink)" }}>{t}</button>)}</div>
      {tab === "products" ? <AdminTable columns={["Product", "Category", "Price", "Rating", "Actions"]} rows={products.map((p) => [p.name, p.category, "₹" + p.price, p.rating, <div style={{ display: "flex", gap: 6 }}><Btn variant="outline" size="sm" onClick={() => setEditing(p)}>Edit</Btn><Btn variant="outline" size="sm" onClick={() => onDeleteProduct?.(p.id)}>Delete</Btn></div>])} /> : <AdminTable columns={["Order", "Customer", "Items", "Total", "Status", "Actions"]} rows={orders.map((o) => [o.id, o.customer || "—", o.items, "₹" + o.total, <select value={o.status} onChange={(e) => onUpdateOrder?.(o.id, e.target.value)} style={{ ...inputStyle, width: 125, padding: "7px 9px" }}>{orderStatuses.map((s) => <option key={s}>{s}</option>)}</select>, <Btn variant="outline" size="sm" onClick={() => onDeleteOrder?.(o.id)}>Delete</Btn>])} />}
      {editing && <EditProductModal product={editing} onClose={() => setEditing(null)} onSave={async (updates) => { await onEditProduct?.(editing.id, updates); setEditing(null); }} />}
    </div>
  );
}

function EditProductModal({ product, onClose, onSave }) {
  const [form, setForm] = useState({ name: product.name || "", category: product.category || "Food", price: String(product.price ?? ""), rating: String(product.rating ?? 0) });
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  return <Modal title="Edit product" onClose={onClose}>
    <Field label="Product name"><input style={inputStyle} value={form.name} onChange={set("name")} /></Field>
    <Field label="Category"><select style={inputStyle} value={form.category} onChange={set("category")}>{productCategories.filter((c) => c !== "All").map((c) => <option key={c}>{c}</option>)}</select></Field>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}><Field label="Price"><input style={inputStyle} type="number" value={form.price} onChange={set("price")} /></Field><Field label="Rating"><input style={inputStyle} type="number" min="0" max="5" step="0.1" value={form.rating} onChange={set("rating")} /></Field></div>
    <Btn size="lg" style={{ width: "100%" }} onClick={() => onSave({ name: form.name.trim(), category: form.category, price: Number(form.price) || 0, rating: Number(form.rating) || 0 })}>Save changes</Btn>
  </Modal>;
}

function AddProductModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    name: "",
    category: "Food",
    price: "",
    rating: "0",
  });

  const set = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = () => {
    if (!form.name || !form.price) return;

    onAdd({
      ...form,
      price: Number(form.price),
      rating: Number(form.rating),
    });
  };

  return (
    <Modal title="Add product" onClose={onClose}>
      <Field label="Product name">
        <input
          style={inputStyle}
          value={form.name}
          onChange={set("name")}
          placeholder="e.g. Premium Dog Food"
        />
      </Field>

      <Field label="Category">
        <select
          style={inputStyle}
          value={form.category}
          onChange={set("category")}
        >
          {productCategories
            .filter((c) => c !== "All")
            .map((c) => (
              <option key={c}>{c}</option>
            ))}
        </select>
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Price">
          <input
            style={inputStyle}
            type="number"
            value={form.price}
            onChange={set("price")}
            placeholder="e.g. 599"
          />
        </Field>

        <Field label="Rating">
          <input
            style={inputStyle}
            type="number"
            min="0"
            max="5"
            step="0.1"
            value={form.rating}
            onChange={set("rating")}
            placeholder="e.g. 4.5"
          />
        </Field>
      </div>

      <Btn
        size="lg"
        style={{ width: "100%", marginTop: 8 }}
        disabled={!form.name || !form.price}
        onClick={submit}
      >
        Add product
      </Btn>
    </Modal>
  );
}

function AdminAdmins({ admins = [], onRoleChange, onDelete }) {
  return (
    <div>
      <PageHeader title="Admins" subtitle="Administrators are kept separate from users and veterinarian listings." />
      <AdminTable
        columns={["Name", "Email", "Role", "Joined", "Actions"]}
        rows={admins.map((a) => [
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Avatar label={a.name} size={30} />{a.name}</div>,
          a.email,
          <select value={a.role} onChange={(e) => onRoleChange?.(a.id, e.target.value)} style={{ ...inputStyle, width: 125, padding: "7px 9px" }}>
            <option value="admin">Admin</option><option value="owner">User</option><option value="vet">Vet</option>
          </select>,
          a.joined,
          <Btn variant="outline" size="sm" onClick={() => onDelete?.(a.id)}>Delete</Btn>,
        ])}
      />
    </div>
  );
}

function AdminReviews({ reviews = [] }) {
  return (
    <div>
      <PageHeader title="Reviews" subtitle="Feedback from pet owners about vets and products." />
      {reviews.length === 0 ? <EmptyNote text="No reviews have been submitted yet." /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {reviews.map((r) => (
            <Panel key={r.id}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Avatar label={r.author} size={32} />
                  <div><div style={{ fontWeight: 600, fontSize: 13.5 }}>{r.author}</div><div style={{ color: "var(--muted)", fontSize: 12 }}>on {r.target}</div></div>
                </div>
                <div style={{ display: "flex", gap: 2 }}>{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={13} fill={i < r.rating ? "var(--accent)" : "none"} color="var(--accent)" />)}</div>
              </div>
              <div style={{ fontSize: 13.5, color: "var(--ink)" }}>{r.text}</div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
