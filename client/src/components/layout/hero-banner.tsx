import { Button } from "@/components/ui/button";
import videoFile from "@assets/generated-video-7ede4b46-489b-451d-8d65-b4ed999381e9_1757132805458.mp4";

export default function HeroBanner() {
  const handleUpgradeVIP = () => {
    alert("Funcionalidade de upgrade VIP em desenvolvimento!");
  };

  return (
    <div className="relative h-80 overflow-hidden">
      {/* Background Video */}
      <video 
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
      >
        <source src={videoFile} type="video/mp4" />
      </video>
      
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/40"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/30 to-blue-900/30"></div>
      
      <div className="relative h-full flex items-center justify-between max-w-6xl mx-auto px-8">
        <div className="flex-1">
          <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
            <span className="text-purple-300">DESBLOQUEIE O</span> <span className="text-white">MÁXIMO</span><br />
            <span className="text-white">DO CONTEÚDO COM A</span><br />
            <span className="text-purple-300">ASSINATURA VIP</span>
          </h1>
          
          <Button 
            onClick={handleUpgradeVIP}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 text-lg"
            data-testid="button-upgrade-vip"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 16L3 14l5.5-5.5L10 10l1.5-1.5L17 14l-2 2-5.5-5.5L5 16z" />
            </svg>
            QUERO SER VIP
          </Button>
        </div>
        
        <div className="flex-shrink-0 ml-8">
          <div className="w-48 h-48 bg-gradient-to-br from-purple-500 to-purple-700 rounded-3xl flex items-center justify-center transform rotate-45 shadow-2xl">
            <div className="transform -rotate-45 text-center">
              <svg
                className="w-16 h-16 text-white mx-auto mb-2"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z" />
              </svg>
              <div className="text-white text-xl font-bold">
                Fórum<br />
                BlackByte
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
