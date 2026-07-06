export type Screen = 'login' | 'home' | 'mock' | 'practice' | 'videos' | 'testSeries' | 'profile' | 'performance' | 'settings' | 'contact' | 'about' | 'terms';

export interface User {
  name: string;
  email: string;
  profilePic: string;
  dob?: string;
  contact?: string;
}

export interface Stats {
  testsTaken: number;
  accuracy: number;
  streak: number;
}

export interface VideoLecture {
  id: string;
  title: string;
  category: string;
  views: number;
  duration: string;
  thumbnail: string;
}

export interface MockTest {
  id: string;
  title: string;
  description: string;
  questions: number;
  timeMin: number;
  price: 'FREE' | 'PAID';
}
