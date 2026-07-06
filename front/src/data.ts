import { MockTest, Stats, VideoLecture } from './types';

export const mockUser = {
  name: "Ankit verma",
  email: "anv9576@gmail.com",
  profilePic: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200&auto=format&fit=crop",
  dob: "1998-05-12",
  contact: "+91 9876543210"
};

export const mockStats: Stats = {
  testsTaken: 3,
  accuracy: 2.3,
  streak: 0
};

export const videoLectures: VideoLecture[] = [
  {
    id: 'v1',
    title: 'SSC CGL Complete Strategy',
    category: 'SSC',
    views: 12500,
    duration: '15:30',
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400&auto=format&fit=crop'
  },
  {
    id: 'v2',
    title: 'Percentage Tricks for Exams',
    category: 'Quant',
    views: 34000,
    duration: '22:45',
    thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=400&auto=format&fit=crop'
  },
  {
    id: 'v3',
    title: 'Current Affairs Masterclass',
    category: 'GK',
    views: 8900,
    duration: '45:10',
    thumbnail: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?q=80&w=400&auto=format&fit=crop'
  }
];

export const mockTestsList: MockTest[] = [
  {
    id: 't1',
    title: 'Ancient India History Test - 1',
    description: 'Based on provided text on Ancient India',
    questions: 82,
    timeMin: 60,
    price: 'FREE'
  },
  {
    id: 't2',
    title: 'Ancient India History Test 2',
    description: 'A comprehensive quiz covering Rigveda, Yaj...',
    questions: 137,
    timeMin: 60,
    price: 'FREE'
  },
  {
    id: 't3',
    title: 'Ancient Indian History Test 3',
    description: 'Sources for the study of Ancient Indian Hist...',
    questions: 80,
    timeMin: 45,
    price: 'FREE'
  },
  {
    id: 't4',
    title: 'History Test Page 04',
    description: 'Lucent GK History Test series',
    questions: 80,
    timeMin: 60,
    price: 'FREE'
  },
  {
    id: 't5',
    title: 'History Test Page 05',
    description: 'Lucent GK History Test series',
    questions: 80,
    timeMin: 60,
    price: 'FREE'
  }
];
