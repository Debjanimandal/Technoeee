'use client';
import Sidebar from '@/components/layout/Sidebar';
import DashboardHeader from '@/components/layout/DashboardHeader';
import Image from 'next/image';

const CHANNELS = [
  { img: '/image/Ellipse 12.jpg', name: 'Marketing Analysis', desc: 'Ut elit tellis color sit amet consectetur adipiscing elit.' },
  { img: '/image/Ellipse 12 (1).jpg', name: 'Graphics Designing', desc: 'Ut elit tellis color sit amet consectetur adipiscing elit.' },
  { img: '/image/Ellipse 12 (2).jpg', name: 'Web Development', desc: 'Ut elit tellis color sit amet consectetur adipiscing elit.' },
  { img: '/image/Ellipse 12 (3).jpg', name: 'Web Designing', desc: 'Ut elit tellis color sit amet consectetur adipiscing elit.' },
  { img: '/image/Ellipse 12 (4).jpg', name: 'Branding Case Study', desc: 'Ut elit tellis color sit amet consectetur adipiscing elit.' },
];

const PENDING = [
  { img: '/image/Ellipse 12 (5).jpg', name: 'Marketing Analysis', desc: 'Ut elit tellis color sit amet consectetur adipiscing elit.' },
  { img: '/image/Ellipse 12 (1).jpg', name: 'Graphics Designing', desc: 'Ut elit tellis color sit amet consectetur adipiscing elit.' },
  { img: '/image/Ellipse 12 (2).jpg', name: 'Web Development', desc: 'Ut elit tellis color sit amet consectetur adipiscing elit.' },
  { img: '/image/Ellipse 12 (3).jpg', name: 'Web Designing', desc: 'Ut elit tellis color sit amet consectetur adipiscing elit.' },
  { img: '/image/Ellipse 12 (4).jpg', name: 'Branding Case Study', desc: 'Ut elit tellis color sit amet consectetur adipiscing elit.' },
];

function ChannelItem({ item }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '10px', border: '1px solid #000', borderRadius: '5px', marginBottom: '10px' }}>
      <Image src={item.img} alt={item.name} width={40} height={40} unoptimized style={{ borderRadius: '50%' }} />
      <div>
        <p style={{ fontWeight: 500, color: '#333', margin: 0 }}>{item.name}</p>
        <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>{item.desc}</p>
      </div>
    </div>
  );
}

export default function CommunityPage() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="page-content" style={{ backgroundColor: '#f5f5f5' }}>
        <DashboardHeader />
        <div className="community-inner-row" style={{ display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1, backgroundColor: '#fff', border: '1px solid #000', borderRadius: '5px', padding: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>Channels</h2>
            {CHANNELS.map(c => <ChannelItem key={c.name} item={c} />)}
          </div>
          <div style={{ flex: 1, backgroundColor: '#fff', border: '1px solid #000', borderRadius: '5px', padding: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>Pending Requests</h2>
            {PENDING.map((c, i) => <ChannelItem key={i} item={c} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
