import CatSprite from './CatSprite'

const ROOM_SCALE = 3 // 512 * 3 = 1536px

export default function CatRoom() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12">
      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="font-pixel text-2xl md:text-4xl text-[#3a2e28] mb-3 tracking-wider">
          Rouzeris
        </h1>
        <p className="font-body text-lg text-[#8a7a6e]">
          ✦ artist · jewelry maker · developer ✦
        </p>
      </div>

      {/* Room container */}
      <div className="relative" style={{ width: 512 * ROOM_SCALE, maxWidth: '95vw' }}>
        <div
          className="relative w-full"
          style={{ paddingBottom: '100%' /* 1:1 aspect ratio */ }}
        >
          {/* Room background */}
          <img
            src="/sprites/room/ExampleRoom.png"
            alt="Yuma's cozy room"
            className="pixel-art absolute inset-0 w-full h-full"
            style={{ imageRendering: 'pixelated' }}
            draggable={false}
          />

          {/* Yuma the cat — walks around the room */}
          <CatSprite />
        </div>

        {/* Shadow under room */}
        <div
          className="mx-auto mt-2 rounded-[50%] opacity-20"
          style={{
            width: '80%',
            height: 24,
            background: 'radial-gradient(ellipse, #8a7a6e 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Nav / info below room */}
      <nav className="mt-10 flex flex-wrap justify-center gap-4 font-pixel text-xs">
        <a
          href="https://www.instagram.com/roksolanas_7"
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-3 bg-[#fff8ef] border-2 border-[#d4b896] rounded-lg hover:bg-[#f5ebe0] hover:border-[#b49cfc] transition-colors shadow-sm"
        >
          📸 Instagram
        </a>
        <a
          href="https://www.instagram.com/jumabestia"
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-3 bg-[#fff8ef] border-2 border-[#d4b896] rounded-lg hover:bg-[#f5ebe0] hover:border-[#e8a0b4] transition-colors shadow-sm"
        >
          🐱 Yuma
        </a>
      </nav>

      {/* Footer */}
      <footer className="mt-16 mb-8 text-center">
        <p className="font-body text-sm text-[#c4b59e]">
          made with ♡ and a cat on the keyboard
        </p>
      </footer>
    </div>
  )
}
