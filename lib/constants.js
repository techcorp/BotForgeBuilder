export const ZEN_MODELS = [
  { id:"claude-sonnet-4-6",      name:"Claude Sonnet 4.6",  provider:"anthropic",     badge:"Recommended", source:"zen" },
  { id:"claude-haiku-4-5",       name:"Claude Haiku 4.5",   provider:"anthropic",     badge:"Fast",        source:"zen" },
  { id:"claude-opus-4-6",        name:"Claude Opus 4.6",    provider:"anthropic",     badge:"Powerful",    source:"zen" },
  { id:"gpt-5.4-mini",           name:"GPT 5.4 Mini",       provider:"openai-compat", badge:"Budget",      source:"zen" },
  { id:"gpt-5.4",                name:"GPT 5.4",            provider:"openai-compat", badge:"",            source:"zen" },
  { id:"gemini-3.5-flash",       name:"Gemini 3.5 Flash",   provider:"google",        badge:"Fast",        source:"zen" },
  { id:"deepseek-v4-flash-free", name:"DeepSeek V4 Flash",  provider:"openai-compat", badge:"Free",        source:"zen" },
  { id:"minimax-m2.5-free",      name:"MiniMax M2.5",       provider:"openai-compat", badge:"Free",        source:"zen" },
  { id:"qwen3.6-plus-free",      name:"Qwen 3.6 Plus",      provider:"openai-compat", badge:"Free",        source:"zen" },
  { id:"nemotron-3-super-free",  name:"Nemotron 3 Super",   provider:"openai-compat", badge:"Free",        source:"zen" },
  { id:"mimo-v2.5-free",         name:"MiMo V2.5",          provider:"openai-compat", badge:"Free",        source:"zen" },
  { id:"big-pickle",             name:"Big Pickle",         provider:"openai-compat", badge:"Free",        source:"zen" },
];

export const ANTHROPIC_MODELS = [
  { id:"claude-sonnet-4-20250514",  name:"Claude Sonnet 4 (Direct)",  provider:"anthropic-direct", source:"anthropic-direct" },
  { id:"claude-opus-4-20250514",    name:"Claude Opus 4 (Direct)",    provider:"anthropic-direct", source:"anthropic-direct" },
  { id:"claude-haiku-4-5-20251001", name:"Claude Haiku 4.5 (Direct)", provider:"anthropic-direct", source:"anthropic-direct" },
];

export const BUSINESS_TEMPLATES = [
  { id:"restaurant", icon:"🍽️", name:"Restaurant",       color:"#FF6B35", desc:"Menu, reservations, orders",    sample:"We are a fine dining restaurant. Our menu includes Biryani, Karahi, BBQ. Open daily 12pm-11pm. Delivery available." },
  { id:"ecommerce",  icon:"🛍️", name:"E-Commerce",        color:"#7C3AED", desc:"Products, orders, tracking",   sample:"We sell electronics online. Free delivery on orders above Rs.5000. Return policy: 7 days. We carry mobiles, laptops, accessories." },
  { id:"clinic",     icon:"🏥", name:"Clinic / Hospital", color:"#059669", desc:"Appointments, doctors, info",  sample:"City Medical Center offers general, cardiology, orthopedic consultations. Book Mon-Sat 9am-5pm. Emergency 24/7." },
  { id:"realestate", icon:"🏠", name:"Real Estate",        color:"#D97706", desc:"Properties, tours, pricing",  sample:"We deal in residential and commercial properties. Free site visits. 10 years experience." },
  { id:"education",  icon:"🎓", name:"Education",          color:"#2563EB", desc:"Courses, admissions, fees",   sample:"We offer IT courses: Web Dev, Python, Graphic Design. Online and on-site. Duration 3-6 months. Certificates provided." },
  { id:"salon",      icon:"💇", name:"Salon / Spa",        color:"#DB2777", desc:"Services, booking, prices",   sample:"Premium salon: haircut, coloring, facial, massage. Appointment required. Open 10am-8pm." },
  { id:"travel",     icon:"✈️", name:"Travel Agency",      color:"#0891B2", desc:"Packages, booking, visa",     sample:"We offer Umrah packages, international tours, domestic trips. Visa assistance available." },
  { id:"custom",     icon:"⚙️", name:"Custom Business",    color:"#6B7280", desc:"Build from scratch",          sample:"" },
];

export const TONES     = ["Professional","Friendly","Formal","Casual","Enthusiastic","Empathetic"];
export const LANGUAGES = ["English","Roman Urdu","Urdu"];

export const THEMES = {
  dark:  { bg:"#0C0C14", surface:"#13131F", border:"#1E1E2E", text:"#E2E8F0", sub:"#64748B", input:"#0C0C14" },
  light: { bg:"#F5F3FA", surface:"#FFFFFF", border:"#D4CFE0", text:"#1A1525", sub:"#6B6580", input:"#EDEAF3" },
};
