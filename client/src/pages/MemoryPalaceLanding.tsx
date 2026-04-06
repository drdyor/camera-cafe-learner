import { useLocation } from 'wouter';
import { ArrowRight, Map, BookOpen, MessageCircle, GraduationCap } from 'lucide-react';
import { getAllRooms } from '@/components/memory-palace/data/rooms';

const rooms = getAllRooms();

const features = [
  {
    icon: Map,
    title: 'Explore the Palace',
    description: 'Navigate through 8 themed rooms, each representing a key grammar concept.',
  },
  {
    icon: BookOpen,
    title: 'Visual Dictionary',
    description: 'Every object is labeled with its Italian name, gender color (blue for masculine, pink for feminine), and pronunciation.',
  },
  {
    icon: GraduationCap,
    title: 'Complete Units',
    description: 'Access full lesson breakdowns, grammar rules, and learning objectives aligned with GCSE and Kelly word frequency.',
  },
  {
    icon: MessageCircle,
    title: 'Practice Dialogues',
    description: 'Listen to native pronunciation and practice conversational Italian with guided dialogues.',
  },
];

export default function MemoryPalaceLanding() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-[#2B1E1A]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#2B1E1A]/90 backdrop-blur-md py-4 px-6 lg:px-12 border-b border-[#F3E8D7]/10">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <button onClick={() => setLocation('/')} className="font-cinzel text-xl text-[#F3E8D7] hover:text-[#E7A04D] transition-colors">
            Memory Palace
          </button>
          <button
            onClick={() => setLocation('/palace/rooms/entrance-hall')}
            className="px-6 py-2 bg-[#E7A04D] text-[#2B1E1A] font-cinzel text-sm rounded-full hover:bg-[#F3E8D7] transition-colors"
          >
            Start Learning
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="font-cinzel text-[#F3E8D7] text-3xl lg:text-5xl leading-tight mb-4">
                Learn Italian by Walking Through a Palace
              </h1>
              <p className="text-[#F3E8D7]/70 text-lg mb-6">
                The Memory Palace transforms language learning into 8 immersive rooms.
                Each object you see becomes a word you remember.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setLocation('/palace/rooms/entrance-hall')}
                  className="px-6 py-3 bg-[#E7A04D] text-[#2B1E1A] font-cinzel font-semibold rounded-full hover:bg-[#F3E8D7] transition-colors flex items-center gap-2"
                >
                  Enter the Palace
                  <ArrowRight size={18} />
                </button>
                <button
                  onClick={() => setLocation('/palace/rooms')}
                  className="px-6 py-3 border border-[#F3E8D7]/30 text-[#F3E8D7] font-cinzel rounded-full hover:border-[#E7A04D] hover:text-[#E7A04D] transition-colors"
                >
                  View All Rooms
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-2xl overflow-hidden border border-[#F3E8D7]/20">
                <img
                  src="/palace/rooms/blueprint.jpg"
                  alt="Palace Blueprint"
                  className="w-full"
                />
              </div>
              <div className="absolute bottom-4 left-4 right-4 bg-[#2B1E1A]/90 backdrop-blur-sm rounded-xl p-4 border border-[#F3E8D7]/10">
                <p className="text-[#F3E8D7]/70 text-sm">
                  <span className="text-[#E7A04D]">Palazzo Mnemisyne</span> — Your memory palace with 8 rooms mapped to Italian grammar
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 px-4 lg:px-8 bg-[#F3E8D7]/5">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="p-6 bg-[#2B1E1A]/50 border border-[#F3E8D7]/10 rounded-xl">
                  <div className="w-10 h-10 bg-[#E7A04D]/20 rounded-lg flex items-center justify-center mb-4">
                    <Icon size={20} className="text-[#E7A04D]" />
                  </div>
                  <h3 className="font-cinzel text-[#F3E8D7] mb-2">{feature.title}</h3>
                  <p className="text-[#F3E8D7]/60 text-sm">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Room Preview */}
      <section className="py-12 px-4 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-cinzel text-[#F3E8D7] text-2xl mb-1">The 8 Rooms</h2>
              <p className="text-[#F3E8D7]/60 text-sm">Each room covers a key Italian grammar concept</p>
            </div>
            <button
              onClick={() => setLocation('/palace/rooms')}
              className="text-[#E7A04D] text-sm hover:underline"
            >
              View all →
            </button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {rooms.map((room, index) => (
              <button
                key={room.id}
                onClick={() => setLocation(`/palace/rooms/${room.id}`)}
                className="group relative overflow-hidden rounded-xl border border-[#F3E8D7]/10 hover:border-[#E7A04D]/50 transition-all text-left"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-[#2B1E1A] via-[#2B1E1A]/80 to-transparent z-10" />
                <img
                  src={room.image}
                  alt={room.name}
                  className="w-full h-40 object-cover group-hover:scale-105 transition-transform"
                />
                <div className="relative z-20 p-4">
                  <span className="text-[#E7A04D] text-xs">Room {index + 1}</span>
                  <h3 className="font-cinzel text-[#F3E8D7]">{room.name}</h3>
                  <p className="text-[#F3E8D7]/50 text-xs">{room.subtitle}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 px-4 lg:px-8 bg-[#F3E8D7]/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-cinzel text-[#F3E8D7] text-2xl mb-8">How the Memory Palace Works</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="w-12 h-12 bg-[#3B82F6] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-cinzel font-bold">1</span>
              </div>
              <h3 className="font-cinzel text-[#F3E8D7] mb-2">Explore</h3>
              <p className="text-[#F3E8D7]/60 text-sm">
                Walk through rooms and click glowing objects. Blue = masculine, Pink = feminine.
              </p>
            </div>
            <div>
              <div className="w-12 h-12 bg-[#EC4899] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-cinzel font-bold">2</span>
              </div>
              <h3 className="font-cinzel text-[#F3E8D7] mb-2">Learn</h3>
              <p className="text-[#F3E8D7]/60 text-sm">
                Study grammar rules, lesson breakdowns, and vocabulary with memory tricks.
              </p>
            </div>
            <div>
              <div className="w-12 h-12 bg-[#E7A04D] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-[#2B1E1A] font-cinzel font-bold">3</span>
              </div>
              <h3 className="font-cinzel text-[#F3E8D7] mb-2">Practice</h3>
              <p className="text-[#F3E8D7]/60 text-sm">
                Listen to dialogues, repeat phrases, and build conversational skills.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 lg:px-8 border-t border-[#F3E8D7]/10">
        <div className="max-w-6xl mx-auto text-center">
          <p className="font-cinzel text-[#F3E8D7] mb-2">Memory Palace</p>
          <p className="text-[#F3E8D7]/50 text-sm">
            Vocabulary aligned with Kelly Word List & GCSE Italian
          </p>
        </div>
      </footer>
    </div>
  );
}
