import CatSprite from './CatSprite'

export default function CatRoom() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header — overlays the room */}
      <header className="relative z-20 text-center pt-6 pb-2">
        <h1 className="font-pixel text-xl md:text-3xl text-[#3a2e28] tracking-wider">
          Rouzeris
        </h1>
        <p className="font-body text-sm md:text-base text-[#8a7a6e] mt-1">
          ✦ artist · jewelry maker · developer ✦
        </p>
      </header>

      {/* Room — fills available space */}
      <main className="flex-1 flex items-center justify-center px-2 pb-2">
        <div
          className="relative w-full h-full max-w-[min(95vw,95vh)]"
          style={{ aspectRatio: '1 / 1' }}
        >
          {/* Room background */}
          <img
            src="/sprites/room/ExampleRoom.png"
            alt="Yuma's cozy room"
            className="absolute inset-0 w-full h-full object-contain"
            style={{ imageRendering: 'pixelated' }}
            draggable={false}
          />

          {/* Yuma the cat — walks around the room */}
          <CatSprite />
        </div>
      </main>

      {/* Nav bar at bottom */}
      <nav className="relative z-20 py-3 flex flex-wrap justify-center gap-3 font-pixel text-[10px] md:text-xs">
        <a
          href="https://www.instagram.com/roksolanas_7"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-[#fff8ef] border-2 border-[#d4b896] rounded-lg hover:bg-[#f5ebe0] hover:border-[#b49cfc] transition-colors shadow-sm"
        >
          📸 Instagram
        </a>
        <a
          href="https://www.instagram.com/jumabestia"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-[#fff8ef] border-2 border-[#d4b896] rounded-lg hover:bg-[#f5ebe0] hover:border-[#e8a0b4] transition-colors shadow-sm"
        >
          🐱 Yuma
        </a>
      </nav>

      <footer className="py-2 text-center">
        <p className="font-body text-xs text-[#c4b59e]">
          made with ♡ and a cat on the keyboard
        </p>
      </footer>
    </div>
  )
}
