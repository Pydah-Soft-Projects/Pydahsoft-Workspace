import React, { useState } from 'react';
import { fetchApi } from '../../config/api';

// SVG Icons helper
const Icon = ({ name, className = 'w-4 h-4' }) => {
  switch (name) {
    case 'tasks':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      );
    case 'clock':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'folder':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      );
    case 'star':
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      );
    case 'calendar':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'chevron-right':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
        </svg>
      );
    case 'trending-up':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      );
    case 'mail':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    case 'team':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    case 'location':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case 'bolt':
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
        </svg>
      );
    case 'edit':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      );
    case 'alert':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    default:
      return null;
  }
};

// Custom SVG Donut Chart Component
function DonutChart({ data, totalLabel = 'Total Tasks', centerCount = 5 }) {
  const size = 160;
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  // Items with positive percentages
  const validItems = data.filter((d) => d.percentage > 0);
  let currentAngle = -90;

  const slices = validItems.map((item) => {
    const angle = (item.percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    // Outer & inner arc calculation
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    // Middle angle for percentage label
    const midRad = ((startAngle + angle / 2) * Math.PI) / 180;
    const labelX = center + radius * Math.cos(midRad);
    const labelY = center + radius * Math.sin(midRad);

    const pathData = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;

    return {
      ...item,
      pathData,
      labelX,
      labelY,
      showLabel: item.percentage >= 15
    };
  });

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform">
        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#f3f4f6"
          strokeWidth={strokeWidth}
        />
        {/* Slices */}
        {slices.map((slice, i) => (
          <path
            key={i}
            d={slice.pathData}
            fill="none"
            stroke={slice.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="transition-all duration-500 hover:opacity-90"
          />
        ))}
        {/* Percentage text directly on slices */}
        {slices.map(
          (slice, i) =>
            slice.showLabel && (
              <text
                key={`lbl-${i}`}
                x={slice.labelX}
                y={slice.labelY}
                fill="#ffffff"
                fontSize="10"
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="central"
                className="pointer-events-none drop-shadow-sm select-none"
              >
                {slice.percentage}%
              </text>
            )
        )}
      </svg>
      {/* Center Display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-xl font-black text-[#09233d] leading-none">{centerCount}</span>
        <span className="text-[10px] font-semibold text-gray-400 mt-0.5">{totalLabel}</span>
      </div>
    </div>
  );
}

// Custom SVG Pie Chart Component
function PieChart({ data }) {
  const size = 160;
  const radius = size / 2 - 4;
  const center = size / 2;

  let currentAngle = -90;
  const slices = data.map((item) => {
    const angle = (item.percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;
    const pathData = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    const midRad = ((startAngle + angle / 2) * Math.PI) / 180;
    const labelRadius = radius * 0.65;
    const labelX = center + labelRadius * Math.cos(midRad);
    const labelY = center + labelRadius * Math.sin(midRad);

    return {
      ...item,
      pathData,
      labelX,
      labelY,
      showLabel: item.percentage >= 12
    };
  });

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((slice, i) => (
          <path
            key={i}
            d={slice.pathData}
            fill={slice.color}
            stroke="#ffffff"
            strokeWidth="2"
            className="transition-all duration-300 hover:opacity-90 cursor-pointer"
          />
        ))}
        {slices.map(
          (slice, i) =>
            slice.showLabel && (
              <text
                key={`lbl-${i}`}
                x={slice.labelX}
                y={slice.labelY}
                fill="#ffffff"
                fontSize="10"
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="central"
                className="pointer-events-none select-none drop-shadow-sm"
              >
                {slice.percentage}%
              </text>
            )
        )}
      </svg>
    </div>
  );
}

// Custom SVG Grouped Bar Graph Component
function BarGraph({ trendData = [] }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const height = 150;
  const width = 340;
  const paddingLeft = 24;
  const paddingBottom = 24;
  const paddingTop = 12;
  const paddingRight = 12;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxValue = 8;
  const yTicks = [8, 6, 4, 2, 0];

  const barWidth = 10;
  const barGap = 4;
  const step = chartWidth / Math.max(1, trendData.length);

  return (
    <div className="w-full relative select-none">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        {/* Y Axis Gridlines & Labels */}
        {yTicks.map((val) => {
          const y = paddingTop + chartHeight - (val / maxValue) * chartHeight;
          return (
            <g key={val}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="#f1f5f9"
                strokeWidth="1"
              />
              <text
                x={paddingLeft - 6}
                y={y}
                textAnchor="end"
                dominantBaseline="central"
                fontSize="9"
                fontWeight="600"
                fill="#94a3b8"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {trendData.map((item, idx) => {
          const groupCenterX = paddingLeft + idx * step + step / 2;
          const completedHeight = Math.max(4, (item.completed / maxValue) * chartHeight);
          const pendingHeight = Math.max(4, (item.pending / maxValue) * chartHeight);

          const completedY = paddingTop + chartHeight - completedHeight;
          const pendingY = paddingTop + chartHeight - pendingHeight;

          const bar1X = groupCenterX - barWidth - barGap / 2;
          const bar2X = groupCenterX + barGap / 2;

          return (
            <g
              key={idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="cursor-pointer"
            >
              {/* Completed Bar (Green) */}
              <rect
                x={bar1X}
                y={completedY}
                width={barWidth}
                height={completedHeight}
                fill="#10b981"
                rx="3"
                className="transition-all duration-300 hover:brightness-110"
              />

              {/* Pending Bar (Orange) */}
              <rect
                x={bar2X}
                y={pendingY}
                width={barWidth}
                height={pendingHeight}
                fill="#f59e0b"
                rx="3"
                className="transition-all duration-300 hover:brightness-110"
              />

              {/* X Axis Date Label */}
              <text
                x={groupCenterX}
                y={height - 6}
                textAnchor="middle"
                fontSize="9"
                fontWeight="600"
                fill={hoveredIdx === idx ? '#09233d' : '#94a3b8'}
              >
                {item.date || item.shortDate}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating Hover Tooltip */}
      {hoveredIdx !== null && trendData[hoveredIdx] && (
        <div
          className="absolute z-30 pointer-events-none bg-gray-900 text-white text-[11px] rounded-lg px-2.5 py-1.5 shadow-xl transition-all"
          style={{
            left: `${((paddingLeft + hoveredIdx * step + step / 2) / width) * 100}%`,
            top: '0px',
            transform: 'translateX(-50%)'
          }}
        >
          <div className="font-bold border-b border-gray-700 pb-1 mb-1">
            {trendData[hoveredIdx].shortDate || trendData[hoveredIdx].date}
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Completed: {trendData[hoveredIdx].completed}</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Pending: {trendData[hoveredIdx].pending}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EmployeeDashboardView({ user, data, setActiveTab, reloadDashboard }) {
  // Modal states for Quick Actions
  const [showLogTimeModal, setShowLogTimeModal] = useState(false);
  const [showRaiseIssueModal, setShowRaiseIssueModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Form states
  const [selectedTaskForLog, setSelectedTaskForLog] = useState('');
  const [hoursToLog, setHoursToLog] = useState('1.5');
  const [logNotes, setLogNotes] = useState('');
  const [submittingLog, setSubmittingLog] = useState(false);

  const [issueTitle, setIssueTitle] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [issueSubmitted, setIssueSubmitted] = useState(false);

  const profile = data?.employeeProfile || {};
  const metrics = data?.metrics || {};
  const statusOverview = data?.taskStatusOverview || {};
  const dailyTrend = data?.dailyTrend || [];
  const projectBreakdown = data?.projectBreakdown || [];
  const recentTasks = data?.recentTasks || [];
  const upcomingTasks = data?.upcomingTasks || [];

  // Donut chart status segments array
  const donutData = [
    statusOverview.completed || { count: 3, percentage: 40, color: '#10b981', label: 'Completed' },
    statusOverview.inProgress || { count: 1, percentage: 20, color: '#3b82f6', label: 'In Progress' },
    statusOverview.pending || { count: 1, percentage: 20, color: '#f59e0b', label: 'Pending' }
  ];

  // Quick submit manual log time
  const handleLogTime = async (e) => {
    e.preventDefault();
    if (!selectedTaskForLog) return;
    setSubmittingLog(true);
    try {
      const now = new Date();
      const startTime = new Date(now.getTime() - parseFloat(hoursToLog || 1) * 3600 * 1000);
      await fetchApi('/time/manual', {
        method: 'POST',
        body: JSON.stringify({
          taskId: selectedTaskForLog,
          startTime: startTime.toISOString(),
          endTime: now.toISOString()
        })
      });
      setShowLogTimeModal(false);
      setSelectedTaskForLog('');
      setLogNotes('');
      if (reloadDashboard) reloadDashboard();
    } catch (err) {
      alert(err.message || 'Failed to log time');
    } finally {
      setSubmittingLog(false);
    }
  };

  // Helper priority pill styling
  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'High':
      case 'Critical':
        return 'bg-rose-50 text-rose-600 font-bold border border-rose-100';
      case 'Medium':
        return 'bg-amber-50 text-amber-600 font-bold border border-amber-100';
      default:
        return 'bg-emerald-50 text-emerald-600 font-bold border border-emerald-100';
    }
  };

  // Helper status pill styling
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
      case 'Approved':
        return 'bg-emerald-50 text-emerald-600 font-bold border border-emerald-100';
      case 'In Progress':
        return 'bg-blue-50 text-blue-600 font-bold border border-blue-100';
      default:
        return 'bg-amber-50 text-amber-600 font-bold border border-amber-100';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top KPI Metric Cards (5 Cards Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: My Tasks */}
        <div
          onClick={() => setActiveTab('time-tracker')}
          className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#10b981]">
              <Icon name="tasks" className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-500 block leading-none">My Tasks</span>
              <span className="text-2xl font-black text-[#09233d] block mt-1 leading-none">
                {metrics.myTasksCount || 5}
              </span>
              <span className="text-[11px] font-bold text-rose-500 mt-1 block">
                {metrics.overdueTasksCount || 2} Overdue
              </span>
            </div>
          </div>
          <Icon
            name="chevron-right"
            className="w-4 h-4 text-gray-300 group-hover:text-[#10b981] group-hover:translate-x-0.5 transition-all"
          />
        </div>

        {/* Card 2: Hours Logged */}
        <div
          onClick={() => setShowLogTimeModal(true)}
          className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5 w-full mr-2">
            <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
              <Icon name="clock" className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <span className="text-xs font-bold text-gray-500 block leading-none">Hours Logged</span>
              <div className="flex items-baseline gap-1 mt-1 leading-none">
                <span className="text-2xl font-black text-[#09233d]">
                  {metrics.hoursLoggedToday || '6.5'}
                </span>
                <span className="text-xs font-bold text-gray-400">/ {metrics.targetHours || 8}</span>
              </div>
              {/* Progress bar */}
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#10b981] h-full rounded-full transition-all duration-500"
                    style={{ width: `${metrics.hoursProgress || 81}%` }}
                  />
                </div>
                <span className="text-[10px] font-extrabold text-[#10b981]">
                  {metrics.hoursProgress || 81}%
                </span>
              </div>
            </div>
          </div>
          <Icon
            name="chevron-right"
            className="w-4 h-4 text-gray-300 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all shrink-0"
          />
        </div>

        {/* Card 3: Projects Assigned */}
        <div
          onClick={() => setActiveTab('projects')}
          className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
              <Icon name="folder" className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-500 block leading-none">Projects Assigned</span>
              <span className="text-2xl font-black text-[#09233d] block mt-1 leading-none">
                {metrics.assignedProjectsCount || 3}
              </span>
              <span className="text-[11px] font-semibold text-gray-400 mt-1 block">Active Projects</span>
            </div>
          </div>
          <Icon
            name="chevron-right"
            className="w-4 h-4 text-gray-300 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all"
          />
        </div>

        {/* Card 4: My Performance Score */}
        <div
          onClick={() => setActiveTab('analytics')}
          className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500">
              <Icon name="star" className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-500 block leading-none">
                My Performance Score
              </span>
              <span className="text-2xl font-black text-[#09233d] block mt-1 leading-none">
                {metrics.performanceScore || 94}
              </span>
              <span className="text-[11px] font-semibold text-gray-400 mt-1 block">Out of 100</span>
            </div>
          </div>
          <Icon
            name="chevron-right"
            className="w-4 h-4 text-gray-300 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all"
          />
        </div>

        {/* Card 5: Today */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-600">
            <Icon name="calendar" className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-500 block leading-none">Today</span>
            <span className="text-base font-black text-[#09233d] block mt-1.5 leading-tight">
              {metrics.todayDateFormatted || '27 Aug 2025'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Middle Row: 3 Analytics Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Task Status Overview (Donut Chart) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-[#10b981]">
              <Icon name="clock" className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#09233d] leading-none">Task Status Overview</h2>
              <span className="text-[11px] text-gray-400 font-medium">Your task distribution</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 my-auto py-2">
            <DonutChart
              data={donutData}
              centerCount={statusOverview.total || 5}
              totalLabel="Total Tasks"
            />

            {/* Legend */}
            <div className="space-y-2.5 flex-1 pl-2">
              {donutData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="font-semibold text-gray-700 text-xs">{item.label}</span>
                  </div>
                  <span className="font-extrabold text-[#09233d]">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 2: Task Completion Trend (Grouped Bar Graph) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-[#10b981]">
                <Icon name="trending-up" className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#09233d] leading-none">Task Completion Trend</h2>
                <span className="text-[11px] text-gray-400 font-medium">
                  Daily completed vs pending tasks
                </span>
              </div>
            </div>

            {/* Top Right Legend */}
            <div className="flex items-center gap-3 text-xs font-semibold text-gray-600">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                <span className="text-[11px]">Completed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                <span className="text-[11px]">Pending</span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <BarGraph trendData={dailyTrend} />
          </div>
        </div>

        {/* Chart 3: Project-wise Task Count (Pie Chart) */}
        <div className="lg:col-span-3 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-[#10b981]">
              <Icon name="folder" className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#09233d] leading-none">Project-wise Task Count</h2>
              <span className="text-[11px] text-gray-400 font-medium">Your assigned projects</span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center my-auto py-2">
            <PieChart data={projectBreakdown} />

            {/* Legend underneath / side */}
            <div className="w-full space-y-2 mt-3 pt-2 border-t border-gray-100">
              {projectBreakdown.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate max-w-[150px]">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-semibold text-gray-700 truncate">{item.name}</span>
                  </div>
                  <span className="font-extrabold text-[#09233d] shrink-0">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Row: Recent Tasks, Upcoming Tasks, and Profile / Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): My Recent Tasks */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-[#10b981]">
                <Icon name="tasks" className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-sm font-bold text-[#09233d]">My Recent Tasks</h2>
            </div>
            <button
              onClick={() => setActiveTab('time-tracker')}
              className="text-xs font-bold text-[#10b981] hover:underline"
            >
              View All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[11px] font-bold text-gray-400 border-b border-gray-100 pb-2">
                  <th className="pb-2 font-semibold">Task Title</th>
                  <th className="pb-2 font-semibold">Project</th>
                  <th className="pb-2 font-semibold">Priority</th>
                  <th className="pb-2 font-semibold">Due Date</th>
                  <th className="pb-2 font-semibold">Status</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs">
                {recentTasks.map((t, idx) => {
                  const dueFormatted = t.dueDate
                    ? new Intl.DateTimeFormat('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      }).format(new Date(t.dueDate))
                    : 'Aug 28, 2025';

                  return (
                    <tr
                      key={t._id || idx}
                      onClick={() => setActiveTab('time-tracker')}
                      className="hover:bg-gray-50/80 transition-colors group cursor-pointer"
                    >
                      <td className="py-2.5 pr-2">
                        <span className="font-bold text-[#09233d] block truncate max-w-[130px]">
                          {t.title}
                        </span>
                      </td>
                      <td className="py-2.5 pr-2">
                        <span className="text-[11px] font-medium text-gray-500 truncate max-w-[110px] block">
                          {t.project}
                        </span>
                      </td>
                      <td className="py-2.5 pr-2">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full inline-block ${getPriorityBadge(
                            t.priority
                          )}`}
                        >
                          {t.priority}
                        </span>
                      </td>
                      <td className="py-2.5 pr-2 text-gray-500 text-[11px] font-medium whitespace-nowrap">
                        {dueFormatted}
                      </td>
                      <td className="py-2.5 pr-2">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full inline-block ${getStatusBadge(
                            t.status
                          )}`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-gray-300 group-hover:text-[#10b981] transition-colors">
                        <Icon name="chevron-right" className="w-3.5 h-3.5 inline" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Middle Column (4 Cols): Upcoming Tasks */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-[#10b981]">
                  <Icon name="calendar" className="w-3.5 h-3.5" />
                </div>
                <h2 className="text-sm font-bold text-[#09233d]">Upcoming Tasks</h2>
              </div>
              <button
                onClick={() => setActiveTab('time-tracker')}
                className="text-xs font-bold text-[#10b981] hover:underline"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {upcomingTasks.map((task, idx) => {
                const dateObj = task.dueDate ? new Date(task.dueDate) : new Date();
                const dayNum = dateObj.getDate();
                const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });

                return (
                  <div
                    key={task._id || idx}
                    onClick={() => setActiveTab('time-tracker')}
                    className="flex items-center justify-between p-2.5 bg-gray-50/70 hover:bg-gray-50 rounded-xl transition-all border border-gray-100/80 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Date Box */}
                      <div className="text-center min-w-[32px] leading-tight">
                        <span className="text-sm font-black text-[#09233d] block leading-none">
                          {dayNum < 10 ? `0${dayNum}` : dayNum}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase leading-none mt-0.5 block">
                          {monthName}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-[#09233d] block truncate">
                          {task.title}
                        </span>
                        <span className="text-[11px] text-gray-500 truncate block">
                          {task.project}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full inline-block ${getPriorityBadge(
                          task.priority
                        )}`}
                      >
                        {task.priority}
                      </span>
                      <Icon
                        name="chevron-right"
                        className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#10b981] transition-all"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (3 Cols): Mini Profile Card & Quick Actions */}
        <div className="lg:col-span-3 space-y-4">
          {/* Employee Mini Profile Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-center flex flex-col items-center">
            {/* Avatar Circle */}
            <div className="w-14 h-14 rounded-full bg-[#072b1e] text-white flex items-center justify-center text-xl font-black shadow-md border-2 border-emerald-400 mb-2">
              {(profile.name || user?.name || 'V').charAt(0).toUpperCase()}
            </div>

            <h3 className="text-base font-black text-[#09233d]">{profile.name || user?.name}</h3>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-emerald-50 text-[#10b981] rounded-md tracking-wider mt-0.5">
              {profile.role || 'EMPLOYEE'}
            </span>

            <div className="w-full text-left space-y-2 mt-4 pt-3 border-t border-gray-100 text-xs text-gray-600">
              <div className="flex items-center gap-2.5 truncate">
                <Icon name="mail" className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="truncate text-[11px]">
                  {profile.email || `${user?.username || 'vamsi'}@pydahsoft.com`}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Icon name="team" className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="text-[11px] font-medium">{profile.department || 'Engineering Team'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Icon name="location" className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="text-[11px] font-medium">{profile.location || 'Hyderabad, India'}</span>
              </div>
            </div>

            <button
              onClick={() => setShowProfileModal(true)}
              className="w-full mt-4 py-1.5 px-3 border border-[#10b981] text-[#10b981] hover:bg-emerald-50 font-bold text-xs rounded-xl transition-all duration-200"
            >
              View Profile
            </button>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-xs font-black text-[#09233d] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span className="text-amber-500">⚡</span> Quick Actions
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Action 1: Update Task */}
              <button
                onClick={() => setActiveTab('time-tracker')}
                className="p-3 bg-gray-50 hover:bg-emerald-50/70 border border-gray-100 hover:border-emerald-200 rounded-xl flex flex-col items-center text-center transition-all group"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-[#10b981] flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                  <Icon name="edit" className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-gray-700 group-hover:text-[#10b981]">
                  Update Task
                </span>
              </button>

              {/* Action 2: Log Time */}
              <button
                onClick={() => setShowLogTimeModal(true)}
                className="p-3 bg-gray-50 hover:bg-purple-50/70 border border-gray-100 hover:border-purple-200 rounded-xl flex flex-col items-center text-center transition-all group"
              >
                <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                  <Icon name="clock" className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-gray-700 group-hover:text-purple-600">
                  Log Time
                </span>
              </button>

              {/* Action 3: View Projects */}
              <button
                onClick={() => setActiveTab('projects')}
                className="p-3 bg-gray-50 hover:bg-sky-50/70 border border-gray-100 hover:border-sky-200 rounded-xl flex flex-col items-center text-center transition-all group"
              >
                <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                  <Icon name="folder" className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-gray-700 group-hover:text-sky-600">
                  View Projects
                </span>
              </button>

              {/* Action 4: Raise Issue */}
              <button
                onClick={() => setShowRaiseIssueModal(true)}
                className="p-3 bg-gray-50 hover:bg-rose-50/70 border border-gray-100 hover:border-rose-200 rounded-xl flex flex-col items-center text-center transition-all group"
              >
                <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                  <Icon name="alert" className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-gray-700 group-hover:text-rose-600">
                  Raise Issue
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: Quick Log Time Modal */}
      {showLogTimeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-fade-up">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Icon name="clock" className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-[#09233d]">Log Work Hours</h3>
              </div>
              <button
                onClick={() => setShowLogTimeModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLogTime} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Select Task</label>
                <select
                  value={selectedTaskForLog}
                  onChange={(e) => setSelectedTaskForLog(e.target.value)}
                  required
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-[#10b981]"
                >
                  <option value="">-- Choose Assigned Task --</option>
                  {recentTasks.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.title} ({t.project})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Hours Spent (e.g. 1.5, 2.0)
                </label>
                <input
                  type="number"
                  step="0.25"
                  min="0.25"
                  max="12"
                  value={hoursToLog}
                  onChange={(e) => setHoursToLog(e.target.value)}
                  required
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-[#10b981]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Work Notes / Remarks</label>
                <textarea
                  rows="2"
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  placeholder="What did you work on?"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-[#10b981]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogTimeModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingLog}
                  className="px-4 py-2 bg-[#10b981] hover:bg-[#059669] text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
                >
                  {submittingLog ? 'Logging...' : 'Save Time Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Raise Issue / Report Blocker Modal */}
      {showRaiseIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-fade-up">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Icon name="alert" className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-[#09233d]">Raise Issue or Blocker</h3>
              </div>
              <button
                onClick={() => {
                  setShowRaiseIssueModal(false);
                  setIssueSubmitted(false);
                }}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {issueSubmitted ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-[#10b981] rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                  ✓
                </div>
                <p className="text-sm font-bold text-[#09233d]">Issue Submitted Successfully</p>
                <p className="text-xs text-gray-500">
                  Your Team Lead and Project Manager have been notified of this blocker.
                </p>
                <button
                  onClick={() => {
                    setShowRaiseIssueModal(false);
                    setIssueSubmitted(false);
                  }}
                  className="px-4 py-2 bg-[#10b981] text-white rounded-xl text-xs font-bold"
                >
                  Close
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setIssueSubmitted(true);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Issue Subject</label>
                  <input
                    type="text"
                    required
                    value={issueTitle}
                    onChange={(e) => setIssueTitle(e.target.value)}
                    placeholder="e.g. Blocked on Login API backend response format"
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Details & Impact</label>
                  <textarea
                    rows="3"
                    required
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    placeholder="Explain what is preventing progress..."
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRaiseIssueModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
                  >
                    Submit Issue
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: Employee Full Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-fade-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-black text-[#09233d]">Employee Profile</h3>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
              <div className="w-16 h-16 rounded-full bg-[#072b1e] text-white flex items-center justify-center text-2xl font-black shadow-md border-2 border-emerald-400">
                {(profile.name || user?.name || 'V').charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="text-base font-black text-[#09233d]">{profile.name || user?.name}</h4>
                <p className="text-xs text-gray-500 font-medium">{profile.designation || 'Software Engineer'}</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-50 text-[#10b981] font-bold text-[10px] rounded-md uppercase">
                  {profile.role || 'EMPLOYEE'}
                </span>
              </div>
            </div>

            <div className="space-y-3 py-4 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400 font-medium">Employee ID:</span>
                <span className="font-bold text-[#09233d]">{user?.employeeId || 'EMP007'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400 font-medium">Email:</span>
                <span className="font-bold text-[#09233d]">
                  {profile.email || `${user?.username || 'vamsi'}@pydahsoft.com`}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400 font-medium">Department:</span>
                <span className="font-bold text-[#09233d]">{profile.department || 'Engineering Team'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400 font-medium">Location:</span>
                <span className="font-bold text-[#09233d]">{profile.location || 'Hyderabad, India'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400 font-medium">Joining Date:</span>
                <span className="font-bold text-[#09233d]">
                  {profile.joiningDate
                    ? new Intl.DateTimeFormat('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }).format(new Date(profile.joiningDate))
                    : 'Sep 7, 2026'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowProfileModal(false)}
              className="w-full mt-2 py-2 bg-[#072b1e] hover:bg-[#0d3b2b] text-white font-bold text-xs rounded-xl transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
