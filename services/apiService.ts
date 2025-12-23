
import { ArtEvent, Artwork, User } from '../types';

/**
 * HƯỚNG DẪN KẾT NỐI BACKEND:
 * 1. Cài đặt: npm install @supabase/supabase-js
 * 2. Khởi tạo Supabase client với URL và Anon Key từ Dashboard của bạn.
 * 3. Thay thế các logic giả lập bên dưới bằng các lệnh gọi database.
 */

export const api = {
  // Lấy danh sách sự kiện từ Database
  getEvents: async (): Promise<ArtEvent[]> => {
    // Logic thực tế: 
    // const { data } = await supabase.from('events').select('*').order('created_at', { ascending: false });
    // return data;
    return []; 
  },
  
  // Lưu sự kiện mới (Admin)
  createEvent: async (event: Partial<ArtEvent>): Promise<ArtEvent | null> => {
    console.log('Backend Logic: Inserting event into DB...', event);
    // Logic thực tế:
    // const { data } = await supabase.from('events').insert(event).select().single();
    // return data;
    return null;
  },

  // Lấy danh sách tác phẩm theo sự kiện
  getArtworks: async (eventId?: string): Promise<Artwork[]> => {
    // Logic thực tế:
    // let query = supabase.from('artworks').select('*');
    // if (eventId) query = query.eq('event_id', eventId);
    // const { data } = await query;
    // return data;
    return [];
  },

  // Xử lý Đấu giá / Mua hàng
  placeBid: async (artworkId: string, userId: string, amount: number): Promise<boolean> => {
    console.log(`Backend Logic: User ${userId} bidding ${amount} on ${artworkId}`);
    // Logic thực tế:
    // 1. Kiểm tra giá cao nhất hiện tại.
    // 2. Cập nhật current_bid và bid_count trong bảng artworks.
    // 3. Sử dụng Supabase Realtime để thông báo cho những người khác.
    return true;
  },

  // Đồng bộ người dùng sau khi login
  syncUser: async (user: User): Promise<void> => {
    console.log('Backend Logic: Checking/Creating user profile in DB', user);
    // Logic thực tế:
    // await supabase.from('profiles').upsert({ id: user.id, name: user.name, role: user.role });
  },

  // Fix: Adding toggleWatchlist method to fix Property 'toggleWatchlist' does not exist error in App.tsx
  toggleWatchlist: async (userId: string, eventId: string): Promise<void> => {
    console.log(`Backend Logic: Toggling watchlist for user ${userId}, event ${eventId}`);
    // Logic thực tế:
    // await supabase.from('watchlist').upsert({ user_id: userId, event_id: eventId });
  }
};
