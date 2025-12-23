
import React from 'react';
import { Language } from '../types';

interface AboutViewProps {
  language: Language;
}

const AboutView: React.FC<AboutViewProps> = ({ language }) => {
  const isVn = language === 'vn';

  return (
    <div className="animate-in duration-700 pb-20">
      {/* About Section */}
      <section className="max-w-4xl mx-auto mb-32">
        <h2 className="text-4xl md:text-6xl font-serif font-black mb-12 italic border-b border-slate-100 pb-8 uppercase tracking-tighter">About Us</h2>
        <div className="prose prose-xl text-slate-600 leading-relaxed font-medium space-y-8">
          <p className="first-letter:text-7xl first-letter:font-serif first-letter:font-black first-letter:text-brand-orange first-letter:mr-4 first-letter:float-left first-letter:leading-none">
            {isVn 
              ? "Xin chào, bọn mình là judooo, một dự án bản đồ nghệ thuật dành cho cộng đồng yêu nghệ thuật! Chúng mình tổng hợp, giới thiệu và lưu trữ các sự kiện nghệ thuật đã, đang và sẽ diễn ra ở Việt Nam."
              : "Hello, we are judooo, an art map project for the art-loving community! We collect, introduce, and archive art events that have happened, are happening, and will happen in Vietnam."
            }
          </p>
          <p>
            {isVn
              ? "Hiểu rằng đôi khi việc tìm kiếm thông tin về các sự kiện nghệ thuật đôi khi khá khó khăn và mất thời gian, judooo là một nền tảng xoá đi những trở ngại đó cũng như trở thành cầu nối giữa mọi người và thế giới nghệ thuật Việt Nam."
              : "Understanding that finding information about art events can sometimes be difficult and time-consuming, judooo is a platform that removes those obstacles and becomes a bridge between people and the Vietnamese art world."
            }
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="max-w-4xl mx-auto mb-32 bg-slate-50 p-10 md:p-16 border-t-[12px] border-brand-orange">
        <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-brand-orange mb-10">Contact Us</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2">Email</p>
            <a href="mailto:judooovietnam@gmail.com" className="text-xl md:text-2xl font-serif font-bold italic hover:text-brand-orange transition-colors">judooovietnam@gmail.com</a>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-4">Social Network</p>
            <div className="flex flex-wrap gap-6">
              {[
                { name: 'FB', url: 'https://www.facebook.com/judooo.art' },
                { name: 'IG', url: 'https://www.instagram.com/judooo.art/' },
                { name: 'Threads', url: 'https://www.threads.net/@judooo.art' },
                { name: 'TikTok', url: 'https://www.tiktok.com/@judooo.art' }
              ].map(social => (
                <a key={social.name} href={social.url} target="_blank" className="text-[10px] font-black uppercase tracking-widest border-b border-brand-black pb-1 hover:text-brand-orange hover:border-brand-orange transition-all">{social.name}</a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Legal Section */}
      <section className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-20">
        <div>
          <h2 className="text-3xl font-serif font-black mb-8 italic uppercase tracking-tighter border-b border-slate-100 pb-4">Terms and Conditions</h2>
          <div className="text-[11px] md:text-xs text-slate-500 uppercase font-black tracking-widest leading-loose space-y-6">
            {isVn ? (
              <>
                <p>Chào bạn đến với judooo! Chúng mình là một nền tảng chia sẻ thông tin về các sự kiện nghệ thuật ở Việt Nam.</p>
                <ul className="space-y-4 list-disc pl-4">
                  <li><strong>Sử dụng judooo:</strong> Bạn có thể tự do tìm kiếm và tham khảo thông tin trên judooo cho mục đích cá nhân.</li>
                  <li><strong>Nội dung:</strong> Chúng mình sẽ cố gắng hết sức để đảm bảo thông tin chính xác và mới nhất.</li>
                  <li><strong>Liên kết ngoài:</strong> judooo không chịu trách nhiệm về nội dung của các trang web liên kết.</li>
                </ul>
                <p>Chúng mình mong muốn judooo là một không gian thân thiện cho cộng đồng yêu nghệ thuật.</p>
              </>
            ) : (
              <>
                <p>Welcome to judooo! We're a platform sharing information about art events in Vietnam.</p>
                <ul className="space-y-4 list-disc pl-4">
                  <li><strong>Using judooo:</strong> You are free to search and refer to information for personal use.</li>
                  <li><strong>Content:</strong> We try our best to ensure accurate information, but mistakes can happen.</li>
                  <li><strong>External Links:</strong> judooo is not responsible for external website content.</li>
                </ul>
                <p>We want judooo to be a helpful space for the art-loving community.</p>
              </>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-serif font-black mb-8 italic uppercase tracking-tighter border-b border-slate-100 pb-4">Privacy Policy</h2>
          <div className="text-[11px] md:text-xs text-slate-500 uppercase font-black tracking-widest leading-loose space-y-6">
            {isVn ? (
              <>
                <p>Chào bạn! Tại judooo, chúng mình coi trọng quyền riêng tư của bạn.</p>
                <ul className="space-y-4 list-disc pl-4">
                  <li><strong>Thu thập:</strong> Chúng mình chỉ thu thập thông tin cần thiết (như email liên hệ).</li>
                  <li><strong>Sử dụng:</strong> Thông tin giúp chúng mình phản hồi bạn và cải thiện nền tảng.</li>
                  <li><strong>Cam kết:</strong> Không chia sẻ thông tin của bạn với bất kỳ bên thứ ba nào.</li>
                </ul>
                <p>Chúng mình luôn nỗ lực bảo vệ quyền riêng tư của bạn tại judooo.</p>
              </>
            ) : (
              <>
                <p>Hi there! At judooo, we value your privacy.</p>
                <ul className="space-y-4 list-disc pl-4">
                  <li><strong>Collection:</strong> We only collect necessary info (like contact email).</li>
                  <li><strong>Usage:</strong> Helps us respond to you and improve judooo.</li>
                  <li><strong>Promise:</strong> No sharing with third parties without consent.</li>
                </ul>
                <p>We work hard to create a safe and trustworthy environment.</p>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutView;
