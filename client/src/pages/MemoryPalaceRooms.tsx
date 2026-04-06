import { useLocation } from 'wouter';
import { ArrowLeft, BookOpen, Utensils, Users, Trees, HelpCircle, Sofa, Frame } from 'lucide-react';
import { getAllRooms } from '@/components/memory-palace/data/rooms';

const rooms = getAllRooms();

const roomIcons = [BookOpen, Utensils, BookOpen, Users, Trees, HelpCircle, Sofa, Frame];

export default function MemoryPalaceRooms() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-[#2B1E1A]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#2B1E1A]/90 backdrop-blur-md py-4 px-6 lg:px-12">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setLocation('/palace')}
            className="flex items-center gap-2 text-[#F3E8D7]/80 hover:text-[#E7A04D] transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-sm">Back to Home</span>
          </button>
          <span className="font-cinzel text-xl text-[#F3E8D7]">All Rooms</span>
          <div className="w-20" />
        </div>
      </nav>

      {/* Content */}
      <div className="pt-24 pb-12 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-cinzel text-[#F3E8D7] text-4xl lg:text-5xl mb-4">
              The 8 Rooms of Your Palace
            </h1>
            <p className="text-[#F3E8D7]/70 max-w-2xl mx-auto">
              Walk through each room in order, or jump to any room to practice specific grammar topics.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {rooms.map((room, index) => {
              const Icon = roomIcons[index] || BookOpen;
              return (
                <button
                  key={room.id}
                  onClick={() => setLocation(`/palace/rooms/${room.id}`)}
                  className="group relative overflow-hidden rounded-2xl text-left transition-all duration-300 hover:scale-[1.02]"
                >
                  {/* Background Image */}
                  <div className="absolute inset-0">
                    <img
                      src={room.image}
                      alt={room.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#2B1E1A] via-[#2B1E1A]/60 to-transparent" />
                  </div>

                  {/* Content */}
                  <div className="relative p-8 min-h-[280px] flex flex-col justify-end">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-[#E7A04D]/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                        <Icon size={20} className="text-[#E7A04D]" />
                      </div>
                      <span className="text-[10px] font-cinzel uppercase tracking-[0.2em] text-[#E7A04D]">
                        ROOM 0{index + 1}
                      </span>
                    </div>
                    <h2 className="font-cinzel text-[#F3E8D7] text-2xl lg:text-3xl mb-2">
                      {room.name}
                    </h2>
                    <p className="text-[#E7A04D] text-sm mb-3">
                      {room.subtitle}
                    </p>
                    <p className="text-[#F3E8D7]/70 text-sm mb-4">
                      {room.description}
                    </p>
                    <div className="flex items-center gap-2 text-[#E7A04D] font-cinzel text-sm">
                      <span>Enter room</span>
                      <span className="group-hover:translate-x-2 transition-transform">→</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
