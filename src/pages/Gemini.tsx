import React, { useState, useRef } from 'react';
import { Camera, Upload, Sparkles, Instagram, Copy, Check, Hash, Tag, Loader2, RefreshCw, Send, ArrowRight, Key, Image } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { storage } from '../services/storage';
import { analyzeImageForInstagram } from '../services/ai';

export default function Gemini() {
  const [image, setImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<{
    caption: string;
    hashtags: string[];
    productDescription: string;
    tags: string[];
  } | null>(null);
  const [extraPrompt, setExtraPrompt] = useState('');
  const [copied, setCopied] = useState<'caption' | 'hashtags' | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const settings = storage.getSettings();
  const hasApiKey = !!settings.geminiApiKey;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMimeType(file.type);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setAnalyzing(true);
    try {
      const data = await analyzeImageForInstagram(image, mimeType, extraPrompt);
      setResult(data);
    } catch (error: any) {
      const msg = error?.message?.includes("API key")
        ? "Please add your Gemini API key in Settings first."
        : "Failed to analyze image. Please try again.";
      alert(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  const copyToClipboard = (text: string, type: 'caption' | 'hashtags') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleInstagramClick = () => {
    // Attempt to open Instagram. If app is installed, it might open the app.
    // Pre-filling text on Instagram isn't supported via URL, but we can at least guide the user.
    window.open('https://instagram.com', '_blank');
  };

  return (
    <div className="space-y-6 pb-24">
      <header className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">AI Content Studio</h2>
        <div className="p-2 bg-pink-50 rounded-full text-pink-600">
          <Sparkles size={20} />
        </div>
      </header>

      {!hasApiKey && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start space-x-3"
        >
          <Key size={18} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-800">API Key Required</p>
            <p className="text-xs text-amber-600 mt-1">Add your Gemini API key in <span className="font-bold">Settings</span> to use AI features.</p>
          </div>
        </motion.div>
      )}

      {!image ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4"
        >
          {/* Camera Button */}
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="w-full aspect-[2/1] rounded-[2rem] border-2 border-dashed border-pink-200 bg-gradient-to-br from-pink-50 to-white flex flex-col items-center justify-center space-y-3 p-8 cursor-pointer hover:border-pink-400 hover:bg-pink-50/30 transition-all group"
          >
            <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 group-hover:scale-110 transition-transform duration-500">
              <Camera size={32} />
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-900 leading-tight">Open Camera</p>
              <p className="text-sm text-gray-400 mt-1">Take a product photo</p>
            </div>
          </button>
          <input 
            type="file" 
            ref={cameraInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            capture="environment"
            className="hidden" 
          />

          {/* Gallery Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-[2/1] rounded-[2rem] border-2 border-dashed border-gray-200 bg-white flex flex-col items-center justify-center space-y-3 p-8 cursor-pointer hover:border-pink-300 hover:bg-pink-50/10 transition-all group"
          >
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 group-hover:text-pink-600 group-hover:scale-110 transition-transform duration-500">
              <Image size={32} />
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-900 leading-tight">Upload from Gallery</p>
              <p className="text-sm text-gray-400 mt-1">Select a photo from your phone</p>
            </div>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
        </motion.div>
      ) : (
        <div className="space-y-6">
          <div className="relative rounded-[2rem] overflow-hidden bg-white border border-gray-100 shadow-sm">
            <img src={image} alt="Upload" className="w-full aspect-square object-cover" />
            <button 
              onClick={() => { setImage(null); setResult(null); }}
              className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md text-white rounded-full hover:bg-black/70 transition-colors"
            >
              <RefreshCw size={18} />
            </button>
          </div>

          {!result && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Any specific focus?</label>
                <textarea 
                  value={extraPrompt}
                  onChange={(e) => setExtraPrompt(e.target.value)}
                  placeholder="Tell Gemini what to highlight (e.g. 'focus on the embroidery', 'seasonal sale', 'traditional vibes')..."
                  className="w-full bg-gray-50 rounded-2xl p-4 text-sm border-transparent focus:border-pink-200 focus:bg-white transition-all outline-none min-h-[100px] resize-none"
                />
                
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="w-full py-4 bg-pink-600 text-white rounded-2xl font-bold flex items-center justify-center space-x-2 shadow-lg shadow-pink-200 hover:bg-pink-700 transition-all disabled:opacity-50"
                >
                  {analyzing ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                  <span>{analyzing ? 'Analyzing Image...' : 'Generate Insta Post'}</span>
                </button>
              </div>
            </motion.div>
          )}

          {result && (
            <div className="space-y-6 pb-12">
              {/* Instagram Preview Card */}
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden max-w-sm mx-auto">
                <div className="p-3 flex items-center justify-between border-b border-gray-50">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600 p-[2px]">
                      <div className="w-full h-full bg-white rounded-full flex items-center justify-center p-1 overflow-hidden">
                        <div className="w-full h-full bg-pink-100 rounded-full flex items-center justify-center text-pink-600 font-bold text-[8px]">
                          {settings.shopName.charAt(0)}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-gray-900 lowercase">{settings.shopName.replace(/\s/g, '_')}</span>
                  </div>
                  <Instagram size={14} className="text-gray-400" />
                </div>
                <img src={image} alt="Post" className="w-full aspect-square object-cover" />
                <div className="p-4 space-y-2">
                  <div className="flex items-center space-x-4 mb-2 pb-2 border-b border-gray-50">
                    <Instagram size={20} className="text-pink-600" />
                    <Sparkles size={20} className="text-yellow-500" />
                    <Send size={20} className="text-blue-500" />
                  </div>
                  <p className="text-sm leading-relaxed">
                    <span className="font-bold mr-2 lowercase">{settings.shopName.replace(/\s/g, '_')}</span>
                    {result.caption}
                  </p>
                  <p className="text-xs text-blue-600 leading-tight">
                    {result.hashtags.join(' ')}
                  </p>
                </div>
              </div>

              {/* Action Tabs */}
              <div className="space-y-4">
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1 flex items-center">
                      <Copy size={12} className="mr-2" /> Caption
                    </h3>
                    <button 
                      onClick={() => copyToClipboard(result.caption, 'caption')}
                      className="text-pink-600"
                    >
                      {copied === 'caption' ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl text-sm italic text-gray-700">
                    {result.caption}
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1 flex items-center">
                      <Hash size={12} className="mr-2" /> Hashtags
                    </h3>
                    <button 
                      onClick={() => copyToClipboard(result.hashtags.join(' '), 'hashtags')}
                      className="text-pink-600"
                    >
                      {copied === 'hashtags' ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl text-xs text-blue-600 break-words line-clamp-2">
                    {result.hashtags.join(' ')}
                  </div>
                </div>

                <div className="bg-pink-600 text-white rounded-3xl p-6 shadow-lg shadow-pink-200 flex items-center justify-between group cursor-pointer" onClick={handleInstagramClick}>
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                      <Instagram size={24} />
                    </div>
                    <div>
                      <p className="font-bold leading-tight">Ready to post?</p>
                      <p className="text-white/70 text-xs mt-0.5">Open Instagram to share</p>
                    </div>
                  </div>
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </div>
                
                <button 
                  onClick={() => setResult(null)}
                  className="w-full py-4 text-gray-400 text-xs uppercase tracking-widest font-bold flex items-center justify-center space-x-2"
                >
                  <RefreshCw size={12} />
                  <span>Start Over</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
