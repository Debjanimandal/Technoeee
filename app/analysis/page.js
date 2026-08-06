'use client';
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';
import Image from 'next/image';

const CALENDAR_DAYS = [
  [{ d: 30, cls: 'empty' }, { d: 31, cls: 'empty' }, { d: 1, cls: 'h1' }, { d: 2 }, { d: 3 }, { d: 4 }, { d: 5 }],
  [{ d: 6 }, { d: 7 }, { d: 8 }, { d: 9 }, { d: 10 }, { d: 11 }, { d: 12 }],
  [{ d: 13 }, { d: 14 }, { d: 15 }, { d: 16 }, { d: 17, cls: 'h17' }, { d: 18 }, { d: 19 }],
  [{ d: 20 }, { d: 21 }, { d: 22 }, { d: 23 }, { d: 24 }, { d: 25 }, { d: 26 }],
  [{ d: 27 }, { d: 28, cls: 'h28' }, { d: 29 }, { d: 30 }, { d: 31 }, { d: 1, cls: 'empty' }, { d: 2, cls: 'empty' }],
  [{ d: 3, cls: 'empty' }, { d: 4, cls: 'empty' }, { d: 5, cls: 'empty' }, { d: 6, cls: 'empty' }, { d: 7, cls: 'empty' }, { d: 8, cls: 'empty' }, { d: 9, cls: 'empty' }],
];

const clsMap = {
  empty: { backgroundColor: '#BBADCE' },
  h1: { backgroundColor: '#ffff99' },
  h17: { backgroundColor: '#87ceeb' },
  h28: { backgroundColor: '#d498d4' },
};

const ACTIVITIES = {
  Saturday: [
    { icon: '/image/Ellipse 12 (4).jpg', category: 'UI/UX Designing', task: 'Dashboard Designing', time: '2hr 25min' },
    { icon: '/image/Ellipse 12 (3).jpg', category: 'Web Development', task: 'HTML One Shot', time: '3hr 30min' },
  ],
  Friday: [
    { icon: '/image/Ellipse 12 (5).jpg', category: 'Marketing Analysis', task: 'Color Theory', time: '2hr 00min' },
  ],
};

export default function AnalysisPage() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="page-content" style={{ backgroundColor: '#fff' }}>
        <DashboardHeader />

        {/* Net Earning + Projects */}
        <div className="analysis-top-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginBottom: '30px' }}>
          <div>
            <h3 style={{ fontSize: '16px', color: '#000', marginBottom: '10px' }}>Net Earning</h3>
            <div style={{ fontSize: '24px', color: '#fff', fontWeight: 'bold', backgroundColor: '#87ceeb', padding: '30px', borderRadius: '5px', display: 'inline-block', border: '1px solid #000' }}>0 $</div>
          </div>
          <div>
            <h3 style={{ fontSize: '16px', color: '#000', marginBottom: '10px' }}>Current Freelancing Projects</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666', marginBottom: '5px' }}>
              <span>Project Name</span><span>Estimated Value</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#333', border: '1px solid #aaa8a8', padding: '10px', borderRadius: '5px' }}>
              <div>Landing Page of an Educational Website</div>
              <div style={{ fontWeight: 'bold' }}>20 $</div>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="analysis-calendar-row" style={{ padding: '20px', border: '1px solid #b9b6b6', borderRadius: '5px', marginBottom: '30px', display: 'flex', gap: '20px', overflowX: 'auto' }}>
          <div style={{ flex: 2 }}>
            <h3 style={{ fontSize: '16px', color: '#201f1f', marginBottom: '10px' }}>Working Calendar</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#bfbfd3', padding: '5px 10px', marginBottom: '10px', borderRadius: '5px', fontWeight: 'bold' }}>
              <span style={{ cursor: 'pointer', fontSize: '18px', color: '#666' }}>⬅</span>
              Jan
              <span style={{ cursor: 'pointer', fontSize: '18px', color: '#666' }}>➡</span>
            </div>
            <table className="calendar-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Tue','Wed','Thu','Fri','Sat','Sun','Mon'].map(d => (
                    <th key={d} style={{ padding: '10px', textAlign: 'center', fontSize: '14px', backgroundColor: '#d8bfd8', color: '#080505' }}>{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CALENDAR_DAYS.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci} style={{ padding: '10px', textAlign: 'center', fontSize: '14px', border: '1px solid #7a7676', ...(clsMap[cell.cls] || {}) }}>{cell.d}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ flex: 1, padding: '10px', border: '1px solid #686666', borderRadius: '5px' }}>
            <h4 style={{ fontSize: '14px', color: '#333', marginBottom: '10px' }}>Most Important Dates:</h4>
            {[
              { box: '#87ceeb', day: 17, label: 'Freelance project submission date' },
              { box: '#dda0dd', day: 28, label: '3rd UI/UX Design Assignment Submission Date' },
            ].map(item => (
              <div key={item.day} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', fontSize: '14px' }}>
                <div style={{ width: 30, height: 30, display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: 10, border: '1px solid #ddd', borderRadius: '5px', backgroundColor: item.box }}>{item.day}</div>
                {item.label}
              </div>
            ))}
          </div>
        </div>

        {/* Activity */}
        <div>
          <h2 style={{ fontSize: '18px', color: '#333', marginBottom: '20px' }}>Your Activity</h2>
          {Object.entries(ACTIVITIES).map(([day, items]) => (
            <div key={day} style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', color: '#333', marginBottom: '10px' }}>{day}</h3>
              {items.map(a => (
                <div key={a.task} style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #ddd', fontSize: '14px', color: '#333' }}>
                  <Image src={a.icon} alt={a.category} width={40} height={40} unoptimized style={{ borderRadius: '50%', marginRight: '10px', objectFit: 'cover' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', color: '#333' }}>{a.category}</div>
                    <div style={{ color: '#666' }}>{a.task}</div>
                  </div>
                  <div style={{ color: '#666' }}>{a.time}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
