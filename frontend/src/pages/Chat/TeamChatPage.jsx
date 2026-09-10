import React, { useState, useEffect, useRef } from 'react';
import { fetchApi } from '../../config/api';

export default function TeamChatPage({ currentUser }) {
  const [staffList, setStaffList] = useState([]);
  const [teamsList, setTeamsList] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState({ type: 'all', data: null }); // type: 'all' | 'team' | 'individual'
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessageText, setNewMessageText] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'chat'
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'admin' | 'lead' | 'employee'

  const messagesEndRef = useRef(null);
  const chatStreamRef = useRef(null);
  const [viewportHeight, setViewportHeight] = useState(null);

  // Dynamic visualViewport listener for mobile keyboard resizing
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    const updateHeight = () => {
      setViewportHeight(window.visualViewport.height);
      window.scrollTo(0, 0);
    };
    window.visualViewport.addEventListener('resize', updateHeight);
    window.visualViewport.addEventListener('scroll', updateHeight);
    updateHeight();
    return () => {
      window.visualViewport.removeEventListener('resize', updateHeight);
      window.visualViewport.removeEventListener('scroll', updateHeight);
    };
  }, []);

  // Fetch all staff members & teams
  useEffect(() => {
    fetchApi('/employees?purpose=chat')
      .then((res) => setStaffList(res.data || []))
      .catch((err) => console.error('Failed to load staff list for chat:', err));

    fetchApi('/teams')
      .then((res) => setTeamsList(res.data || []))
      .catch((err) => console.error('Failed to load teams list:', err));
  }, []);

  // Fetch messages from server
  const loadMessages = async (silent = false) => {
    if (!silent) setLoadingMessages(true);
    try {
      const res = await fetchApi('/chat/messages');
      if (res.data) {
        setMessages(res.data);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  // Initial load + live polling every 3 seconds
  useEffect(() => {
    loadMessages();
    const interval = setInterval(() => {
      loadMessages(true);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll inside chat stream only (prevents full page jump on mobile)
  useEffect(() => {
    if (chatStreamRef.current) {
      chatStreamRef.current.scrollTop = chatStreamRef.current.scrollHeight;
    }
  }, [messages, selectedRecipient]);

  // Filter messages for active selection
  const filteredMessages = messages.filter((msg) => {
    if (selectedRecipient.type === 'all') {
      return msg.recipientType === 'all';
    } else if (selectedRecipient.type === 'team' && selectedRecipient.data) {
      return msg.recipientType === 'team' && String(msg.teamId) === String(selectedRecipient.data._id);
    } else if (selectedRecipient.type === 'individual' && selectedRecipient.data) {
      const targetId = String(selectedRecipient.data._id);
      const myId = String(currentUser?._id);
      const msgSender = String(msg.sender);
      const msgRecipient = String(msg.recipientId);

      return (
        msg.recipientType === 'individual' &&
        ((msgSender === myId && msgRecipient === targetId) ||
         (msgSender === targetId && msgRecipient === myId))
      );
    }
    return false;
  });

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;

    setSending(true);
    try {
      const recipientType = selectedRecipient.type;
      const recipientId = recipientType === 'individual' ? selectedRecipient.data?._id : undefined;
      const recipientName = recipientType === 'individual' ? selectedRecipient.data?.name : undefined;
      const teamId = recipientType === 'team' ? selectedRecipient.data?._id : undefined;
      const teamName = recipientType === 'team' ? selectedRecipient.data?.name : undefined;

      const res = await fetchApi('/chat/send', {
        method: 'POST',
        body: JSON.stringify({
          recipientType,
          recipientId,
          recipientName,
          teamId,
          teamName,
          message: newMessageText.trim()
        })
      });

      if (res.data) {
        setMessages((prev) => [...prev, res.data]);
        setNewMessageText('');
      }
    } catch (err) {
      alert(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const filteredStaff = staffList.filter((emp) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      (emp.name || '').toLowerCase().includes(query) ||
      (emp.username || '').toLowerCase().includes(query) ||
      (emp.employeeId || '').toLowerCase().includes(query) ||
      (emp.role || '').toLowerCase().includes(query) ||
      (emp.designation || '').toLowerCase().includes(query) ||
      (emp.department || '').toLowerCase().includes(query) ||
      (emp.email || '').toLowerCase().includes(query);

    if (!matchesSearch) return false;
    if (roleFilter === 'all') return true;

    const role = (emp.role || 'employee').toLowerCase();
    const designation = (emp.designation || '').toLowerCase();

    if (roleFilter === 'admin') {
      return role.includes('admin') || role.includes('super') || designation.includes('admin');
    } else if (roleFilter === 'lead') {
      return role.includes('lead') || role.includes('superior') || role.includes('manager') || designation.includes('lead') || designation.includes('manager');
    } else if (roleFilter === 'employee') {
      return (
        role.includes('employee') ||
        role === 'staff' ||
        (!role.includes('admin') && !role.includes('super') && !role.includes('lead') && !role.includes('superior') && !role.includes('manager'))
      );
    }
    return true;
  });

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleRoleFilterClick = (targetRole) => {
    setRoleFilter(targetRole);
  };

  return (
    <div className="chat-page h-[calc(100dvh-95px)] md:h-[calc(100vh-140px)] md:min-h-[550px] bg-white rounded-2xl border border-gray-200 shadow-lg flex flex-col md:flex-row overflow-hidden">
      {/* LEFT PANEL: Persons & Group Conversations List */}
      <div className={`${mobileView === 'chat' ? 'hidden md:flex' : 'flex'} chat-page__contacts w-full md:w-96 bg-white border-r border-gray-200 flex-col shrink-0 h-full overflow-y-auto no-scrollbar md:scrollbar-thin`}>
        {/* Header (Desktop only) */}
        <div className="hidden md:block p-3 md:p-4 border-b border-gray-200 bg-white shrink-0">
          <h2 className="text-base md:text-lg font-black text-[#09233d] flex items-center gap-2">
            Team Messaging Hub
            <span className="w-2 md:w-2.5 h-2 md:h-2.5 rounded-full bg-[#20b875] animate-pulse" />
          </h2>
          <p className="text-xs md:text-sm text-gray-500 font-medium mt-0.5 md:mt-1">Select group, team, or staff member to chat</p>
        </div>

        {/* Global Broadcast Option (Desktop only) */}
        <div className="hidden md:block p-2 md:p-3 border-b border-gray-200 shrink-0">
          <button
            type="button"
            onClick={() => {
              setSelectedRecipient({ type: 'all', data: null });
              setMobileView('chat');
            }}
            className={`w-full p-2 md:p-3 rounded-lg md:rounded-xl font-bold text-xs md:text-sm text-left transition-all flex items-center justify-between cursor-pointer ${
              selectedRecipient.type === 'all'
                ? 'bg-emerald-50 text-[#09233d] border-[#20b875] shadow-xs'
                : 'bg-white text-gray-700 hover:bg-emerald-50/50 border border-gray-200'
            }`}
          >
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 md:w-10 h-8 md:h-10 rounded-lg md:rounded-xl bg-[#20b875] text-white flex items-center justify-center font-bold text-xs md:text-sm shrink-0">
                <svg className="w-4 md:w-5 h-4 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <div>
                <span className="block font-black text-xs md:text-sm text-[#09233d]">Everyone (Company Broadcast)</span>
                <span className="block text-xs md:text-xs font-medium text-gray-500 mt-0.5">
                  Public All-Staff Announcements
                </span>
              </div>
            </div>
            {selectedRecipient.type === 'all' && (
              <span className="w-2 md:w-2.5 h-2 md:h-2.5 rounded-full bg-[#20b875] shrink-0" />
            )}
          </button>
        </div>

        {/* Teams & Channels List */}
        <div className="px-2 md:px-3 pt-2 md:pt-3 pb-1.5 md:pb-2 border-b border-gray-200">
          <div className="px-1 mb-1.5 md:mb-2 text-xs font-extrabold text-gray-400 uppercase tracking-wider">
            Teams & Departments ({teamsList.length})
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 md:py-0 md:block md:space-y-1.5">
            {/* Mobile-only "Everyone" pill button */}
            <button
              type="button"
              onClick={() => {
                setSelectedRecipient({ type: 'all', data: null });
                setMobileView('chat');
              }}
              className={`md:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 border ${
                selectedRecipient.type === 'all'
                  ? 'bg-emerald-50 text-[#09233d] border-[#20b875] shadow-xs'
                  : 'bg-white hover:bg-emerald-50/50 text-[#09233d] border-gray-200 shadow-2xs'
              }`}
            >
              <svg className="w-3.5 h-3.5 shrink-0 text-[#20b875]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
              <span className="truncate">Everyone</span>
            </button>

            {teamsList.map((team) => {
              const isSelected =
                selectedRecipient.type === 'team' &&
                selectedRecipient.data?._id === team._id;

              return (
                <button
                  key={team._id}
                  type="button"
                  onClick={() => {
                    setSelectedRecipient({ type: 'team', data: team });
                    setMobileView('chat');
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 md:w-full md:p-2.5 md:flex md:items-center md:justify-between border ${
                    isSelected
                      ? 'bg-emerald-50 text-[#09233d] border-[#20b875] shadow-xs'
                      : 'bg-white hover:bg-emerald-50/50 text-[#09233d] border-gray-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-1.5 md:gap-2.5 truncate">
                    <svg className="w-3.5 md:w-4 h-3.5 md:h-4 shrink-0 text-[#20b875]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="truncate text-xs md:text-sm font-bold text-[#09233d]">{team.name}</span>
                  </div>
                  <span className="hidden md:inline-block text-xs font-extrabold px-1.5 md:px-2 py-0.5 rounded-md bg-emerald-100 text-[#20b875]">
                    Team
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Role Filter Pills */}
        <div className="grid grid-cols-4 gap-1.5 p-2 md:p-2.5 bg-slate-50 border-b border-gray-200 w-full">
          <button
            type="button"
            onClick={() => handleRoleFilterClick('all')}
            className={`w-full py-1.5 px-1 md:px-2 rounded-lg md:rounded-xl text-[11px] sm:text-xs font-extrabold text-center transition-all cursor-pointer truncate ${
              roleFilter === 'all'
                ? 'bg-[#20b875] text-white shadow-2xs'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
            }`}
          >
            All ({staffList.length})
          </button>
          <button
            type="button"
            onClick={() => handleRoleFilterClick('admin')}
            className={`w-full py-1.5 px-1 md:px-2 rounded-lg md:rounded-xl text-[11px] sm:text-xs font-extrabold text-center transition-all cursor-pointer truncate ${
              roleFilter === 'admin'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
            }`}
          >
            Admins
          </button>
          <button
            type="button"
            onClick={() => handleRoleFilterClick('lead')}
            className={`w-full py-1.5 px-1 md:px-2 rounded-lg md:rounded-xl text-[11px] sm:text-xs font-extrabold text-center transition-all cursor-pointer truncate ${
              roleFilter === 'lead'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
            }`}
          >
            Team Leads
          </button>
          <button
            type="button"
            onClick={() => handleRoleFilterClick('employee')}
            className={`w-full py-1.5 px-1 md:px-2 rounded-lg md:rounded-xl text-[11px] sm:text-xs font-extrabold text-center transition-all cursor-pointer truncate ${
              roleFilter === 'employee'
                ? 'bg-[#20b875] text-white shadow-2xs'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
            }`}
          >
            Employees
          </button>
        </div>

        {/* Search Input Box */}
        <div className="p-2 md:p-3 border-b border-gray-200 bg-white">
          <div className="relative">
            <input
              type="text"
              placeholder="Search staff, leads, or superadmin..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              inputMode="search"
              autoComplete="off"
              aria-label="Search contacts"
              className="w-full pl-7 md:pl-8 pr-3 py-2 md:py-2.5 bg-gray-50 border border-gray-200 rounded-lg md:rounded-xl text-xs md:text-sm text-[#09233d] font-medium focus:bg-white focus:border-[#20b875] outline-none"
            />
            <svg className="w-3.5 md:w-4 h-3.5 md:h-4 text-gray-400 absolute left-2 md:left-2.5 top-2.5 md:top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Individual Contact Directory List */}
        <div className="p-2 md:p-3 space-y-1 md:space-y-1.5">
          <div className="px-1 py-0.5 md:py-1 text-xs font-extrabold text-gray-400 uppercase tracking-wider">
            Direct 1-on-1 Contacts ({filteredStaff.length})
          </div>

          {filteredStaff.length === 0 ? (
            <div className="p-3 md:p-4 text-center text-xs md:text-sm text-gray-500 bg-white rounded-lg md:rounded-xl border border-gray-100 font-medium">
              {searchQuery.trim()
                ? `No staff found matching "${searchQuery}"`
                : 'No contacts found'}
            </div>
          ) : (
            filteredStaff.map((emp) => {
              const isSelected =
                selectedRecipient.type === 'individual' &&
                selectedRecipient.data?._id === emp._id;
              const isMe = emp._id === currentUser?._id;

              return (
                <button
                  key={emp._id}
                  type="button"
                  onClick={() => {
                    setSelectedRecipient({ type: 'individual', data: emp });
                    setMobileView('chat');
                  }}
                  className={`w-full p-2 md:p-3 rounded-lg md:rounded-xl text-left text-xs md:text-sm font-bold transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50 text-[#09233d] border-[#20b875] shadow-xs'
                      : 'bg-white hover:bg-emerald-50/40 text-[#09233d] border border-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2 md:gap-3 truncate">
                    <div className="w-7 md:w-9 h-7 md:h-9 rounded-full flex items-center justify-center font-bold text-xs md:text-sm shrink-0 bg-emerald-100 text-[#20b875]">
                      {emp.name ? emp.name.charAt(0).toUpperCase() : 'E'}
                    </div>
                    <div className="truncate">
                      <span className="block text-xs md:text-sm font-bold truncate text-[#09233d]">
                        {emp.name} {isMe && '(You)'}
                      </span>
                      <span className="block text-xs font-medium truncate text-gray-400 mt-0.5">
                        @{emp.username || emp.employeeId || 'staff'}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-extrabold px-1.5 md:px-2 py-0.5 md:py-1 rounded-md uppercase shrink-0 ${
                      emp.role === 'superadmin' || emp.role === 'admin'
                        ? 'bg-rose-100 text-rose-700'
                        : emp.role === 'superior' || emp.role === 'teamlead'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-emerald-50 text-[#20b875]'
                    }`}
                  >
                    {emp.role || 'EMPLOYEE'}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Chat Stream & Message Input - Proper Desktop Layout */}
      <div className={`${mobileView === 'list' ? 'hidden md:flex' : 'flex'} flex-col flex-1 w-full h-full md:min-h-0 bg-white overflow-hidden`}>
        {/* 1. HEADER SECTION - Fixed at Top */}
        <div className="p-3 md:p-4 bg-white border-b border-gray-200 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2.5 md:gap-3 truncate">
            {/* Mobile Back Button */}
            <button
              type="button"
              onClick={() => setMobileView('list')}
              className="md:hidden p-2 text-gray-600 hover:text-[#09233d] hover:bg-gray-100 rounded-xl transition-all shrink-0 cursor-pointer flex items-center justify-center border border-gray-200"
              title="Back to contacts list"
              aria-label="Back to contacts list"
            >
              <svg className="w-4 h-4 text-[#20b875]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-emerald-50 text-[#20b875] border border-emerald-100 flex items-center justify-center font-black text-sm md:text-base shrink-0 shadow-sm">
              {selectedRecipient.type === 'all' ? (
                <svg className="w-5 h-5 text-[#20b875]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              ) : selectedRecipient.type === 'team' ? (
                <svg className="w-5 h-5 text-[#20b875]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              ) : (
                selectedRecipient.data?.name?.charAt(0).toUpperCase() || 'U'
              )}
            </div>
            <div className="truncate">
              <h3 className="text-sm md:text-base font-black text-[#09233d] truncate">
                {selectedRecipient.type === 'all'
                  ? 'Everyone'
                  : selectedRecipient.type === 'team'
                  ? selectedRecipient.data?.name
                  : selectedRecipient.data?.name}
              </h3>
              <p className="text-xs md:text-sm text-gray-500 font-medium truncate">
                {selectedRecipient.type === 'all'
                  ? 'Company broadcast channel'
                  : selectedRecipient.type === 'team'
                  ? 'Team conversation'
                  : `Private conversation · ${selectedRecipient.data?.role || 'Staff'}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              className="p-2.5 text-gray-500 hover:text-[#20b875] hover:bg-emerald-50 rounded-full transition-colors"
              title="Start video call"
              aria-label="Start video call"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              type="button"
              className="p-2.5 text-gray-500 hover:text-[#20b875] hover:bg-emerald-50 rounded-full transition-colors"
              title="Start voice call"
              aria-label="Start voice call"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 5a2 2 0 012-2h2.28a1 1 0 01.95.684l1.1 3.3a1 1 0 01-.27 1.04L7.6 9.49a16 16 0 006.91 6.91l1.46-1.46a1 1 0 011.04-.27l3.3 1.1A1 1 0 0121 16.72V19a2 2 0 01-2 2h-1C9.16 21 3 14.84 3 7V5z" />
              </svg>
            </button>
            <button
              type="button"
              className="p-2.5 text-gray-500 hover:text-[#20b875] hover:bg-emerald-50 rounded-full transition-colors"
              title="Chat options"
              aria-label="Chat options"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>
          </div>
        </div>

        {/* 2. MESSAGES SECTION - Desktop Layout */}
        <div ref={chatStreamRef} className="chat-page__stream flex-1 p-4 overflow-y-auto bg-gray-50 min-h-0">
          {loadingMessages && messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-sm text-gray-400 font-medium">
              Loading chat history...
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 text-gray-400">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#20b875] flex items-center justify-center mb-4 shadow-sm border border-emerald-100">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-base font-bold text-gray-700">No messages in this conversation yet</p>
              <p className="text-sm text-gray-400 mt-2">
                Type a message below to start chatting!
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {/* Today Divider */}
              <div className="flex items-center justify-center my-8">
                <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200 text-sm font-medium text-gray-600">
                  Today
                </div>
              </div>
              
              {filteredMessages.map((msg, index) => {
                const isMe = String(msg.sender) === String(currentUser?._id);
                const showAvatar = !isMe && (index === 0 || filteredMessages[index - 1]?.sender !== msg.sender);

                return (
                  <div key={msg._id || msg.createdAt} className="mb-6">
                    {isMe ? (
                      // My Messages - Right Side
                      <div className="flex justify-end">
                        <div className="max-w-[65%]">
                          <div className="bg-[#20b875] text-white rounded-2xl rounded-br-md px-4 py-3 shadow-sm">
                            <div className="text-sm leading-relaxed break-words">
                              {msg.message}
                            </div>
                            <div className="flex items-center justify-end gap-2 mt-2">
                              <span className="text-xs text-emerald-100">
                                {formatTime(msg.createdAt)}
                              </span>
                              <svg className="w-4 h-4 text-emerald-100" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Other Messages - Left Side with Avatar
                      <div className="flex items-start gap-3">
                        {showAvatar && (
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-sm text-[#20b875] shrink-0 mt-1 shadow-sm">
                            {msg.senderName ? msg.senderName.charAt(0).toUpperCase() : 'U'}
                          </div>
                        )}
                        
                        {!showAvatar && (
                          <div className="w-10 shrink-0"></div>
                        )}

                        <div className="max-w-[65%]">
                          {showAvatar && (
                            <div className="text-sm font-bold text-[#20b875] mb-2 px-1">
                              {msg.senderName}
                            </div>
                          )}
                          
                          <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                            <div className="text-sm text-gray-800 leading-relaxed break-words">
                              {msg.message}
                            </div>
                            <div className="flex justify-end mt-2">
                              <span className="text-xs text-gray-500">
                                {formatTime(msg.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 3. INPUT SECTION */}
        <div className="p-2 sm:p-3 md:p-4 bg-white border-t border-gray-200 flex items-center gap-2 md:gap-3 shrink-0">
          <button
            type="button"
            className="p-2 md:p-2.5 text-gray-500 hover:text-[#20b875] hover:bg-emerald-50 rounded-full transition-colors shrink-0"
            title="Attach a file"
            aria-label="Attach a file"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.586-6.586a4 4 0 00-5.656-5.656l-6.586 6.586a6 6 0 108.485 8.485L20.5 13.5" />
            </svg>
          </button>
          
          <div className="flex-1 flex items-center bg-gray-50 rounded-full border border-gray-200 hover:border-gray-300 focus-within:border-[#20b875] transition-colors">
            <input
              type="text"
              value={newMessageText}
              inputMode="text"
              enterKeyHint="send"
              autoComplete="off"
              aria-label="Message"
              onChange={(e) => setNewMessageText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              onFocus={() => {
                setTimeout(() => {
                  if (chatStreamRef.current) {
                    chatStreamRef.current.scrollTop = chatStreamRef.current.scrollHeight;
                  }
                }, 100);
              }}
              placeholder="Type a message..."
              className="flex-1 px-3.5 md:px-5 py-2 md:py-3 bg-transparent text-xs md:text-sm text-[#09233d] font-medium outline-none placeholder:text-gray-500"
            />
            
            <button
              type="button"
              className="p-1.5 md:p-2.5 text-gray-500 hover:text-[#20b875] hover:bg-emerald-50 rounded-full transition-colors mr-1 md:mr-2"
              title="Add emoji"
              aria-label="Add emoji"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>

          <button
            type="submit"
            disabled={sending || !newMessageText.trim()}
            onClick={handleSendMessage}
            className="w-9 h-9 md:w-12 md:h-12 rounded-full bg-[#20b875] hover:bg-[#18995e] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center shrink-0 shadow-md transition-all cursor-pointer"
            title="Send Message"
          >
            {sending ? (
              <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4 md:w-6 md:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
