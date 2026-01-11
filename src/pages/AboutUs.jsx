import Navbar from "../components/Navbar";
import {
  UserGroupIcon,
  LightBulbIcon,
  GlobeAltIcon,
  RocketLaunchIcon,
} from "@heroicons/react/24/outline";
import OptimizedImage from "../components/OptimizedImage";

import vishvaImg from "../assets/vishva.jpeg";
import krishaImg from "../assets/krisha.jpeg";

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f3f9fd] to-[#eaf6ff]">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* PAGE TITLE */}
        <h1 className="text-3xl font-semibold text-blue-600 mb-4">
          About ValueVue
        </h1>

        <p className="text-slate-600 max-w-3xl mb-12">
          ValueVue is a smart product price comparison platform designed to help
          users make informed buying decisions by comparing prices across
          multiple retailers in one place.
        </p>

        {/* INFO CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <InfoCard
            icon={UserGroupIcon}
            title="Who We Are"
            text="A student-led team building modern and user-friendly web applications."
          />
          <InfoCard
            icon={LightBulbIcon}
            title="Our Vision"
            text="To simplify online shopping through transparent price comparison."
          />
          <InfoCard
            icon={GlobeAltIcon}
            title="Our Platform"
            text="We collect and compare prices from multiple online retailers."
          />
          <InfoCard
            icon={RocketLaunchIcon}
            title="Our Goal"
            text="Helping users save time and money with smarter shopping decisions."
          />
        </div>

        {/* TEAM SECTION */}
        <div className="mb-20">
          <h2 className="text-2xl font-semibold text-blue-600 mb-8">
            Meet the Team
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-3xl">
            <TeamCard
              name="Vishva Trivedi"
              role="Frontend Developer"
              image={vishvaImg}
            />
            <TeamCard
              name="Krisha Chaudhari"
              role="Backendend Developer"
              image={krishaImg}
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className="text-center text-sm text-slate-500">
          Built with ❤️ by the ValueVue Team
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, title, text }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition">
      <Icon className="w-8 h-8 text-blue-600 mb-3" />
      <h3 className="font-semibold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-600">{text}</p>
    </div>
  );
}

function TeamCard({ name, role, image }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition text-center">
      <OptimizedImage
        src={image}
        alt={name}
        className="w-28 h-28 mx-auto rounded-full object-cover mb-4 border-4 border-blue-100"
      />
      <h3 className="font-semibold text-slate-800">{name}</h3>
      <p className="text-sm text-slate-500">{role}</p>
    </div>
  );
}
