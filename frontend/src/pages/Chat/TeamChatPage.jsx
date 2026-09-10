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
        <div className="hidden md:block p-3 md:p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-base md:text-lg font-black text-[#09233d] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#20b875] animate-pulse"></span>
              Team Messaging Hub
            </h2>
            <span className="text-xs font-bold text-gray-500 bg-emerald-50 text-[#20b875] border border-emerald-100 px-2 py-0.5 rounded-full">
              Live
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1 font-medium">
            Communicate across the organization in real-time
          </p>
        </div>

        {/* Everyone Broadcast Card (Desktop only) */}
        <div className="hidden md:block p-2 md:p-3 border-b border-gray-200">
          <button
            type="button"
            onClick={() => {
              setSelectedRecipient({ type: 'all', data: null });
              setMobileView('chat');
            }}
            className={`w-full p-2.5 md:p-3 rounded-xl md:rounded-2xl text-left transition-all flex items-center justify-between cursor-pointer border ${
              selectedRecipient.type === 'all'
                ? 'bg-emerald-50 text-[#09233d] border-[#20b875] shadow-xs'
                : 'bg-white hover:bg-emerald-50/50 text-[#09233d] border-gray-100'
            }`}
          >
            <div className="flex items-center gap-2.5 md:gap-3 truncate">
              <div className="w-8 md:w-10 h-8 md:h-10 rounded-xl bg-emerald-100 text-[#20b875] flex items-center justify-center font-bold text-base shrink-0 shadow-2xs">
                <svg className="w-5 h-5 text-[#20b875]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <div className="truncate">
                <span className="block text-xs md:text-sm font-extrabold truncate text-[#09233d]">
                  Everyone
                </span>
                <span className="block text-xs text-gray-500 font-medium truncate">
                  Company broadcast channel
                </span>
              </div>
            </div>
            <span className="text-xs font-black px-2 py-0.5 rounded-full bg-emerald-100 text-[#20b875] shrink-0">
              ALL
            </span>
          </button>
        </div>

        {/* Teams & Departments horizontal list */}
        <div className="p-2 md:p-3 border-b border-gray-200">
          <div className="flex items-center justify-between mb-1.5 md:mb-2 px-1">
            <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">
              Teams & Departments
            </span>
            <span className="text-xs font-bold text-gray-400">
              {teamsList.length}
            </span>
          </div>

          <div className="flex md:flex-wrap gap-1.5 overflow-x-auto no-scrollbar md:overflow-x-visible pb-1 md:pb-0">
            {/* Mobile-only "Everyone" broadcast pill */}
            <button
              type="button"
              onClick={() => {
                setSelectedRecipient({ type: 'all', data: null });
                setMobileView('chat');
              }}
              className={`md:hidden px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${
                selectedRecipient.type === 'all'
                  ? 'bg-[#20b875] text-white border-[#20b875] shadow-2xs'
                  : 'bg-white text-[#09233d] border-gray-200 hover:border-[#20b875]'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
              Everyone
            </button>

            {teamsList.length === 0 ? (
              <span className="text-xs text-gray-400 italic px-1">No specific teams created</span>
            ) : (
              teamsList.map((team) => {
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
                    className={`px-2.5 md:px-3 py-1.5 rounded-lg md:rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-[#20b875] text-white border-[#20b875] shadow-2xs'
                        : 'bg-white text-[#09233d] border-gray-200 hover:border-[#20b875]'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                    {team.name}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Role Filters Grid */}
        <div className="grid grid-cols-4 w-full gap-1 p-2 md:p-3 border-b border-gray-200 bg-gray-50/50">
          <button
            type="button"
            onClick={() => handleRoleFilterClick('all')}
            className={`w-full py-1.5 px-1 md:px-2 rounded-lg md:rounded-xl text-[11px] sm:text-xs font-extrabold text-center transition-all cursor-pointer truncate ${
              roleFilter === 'all'
                ? 'bg-[#09233d] text-white shadow-2xs'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
            }`}
          >
            All
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

      {/* RIGHT PANEL: Chat Stream & Message Input - Fullscreen on Mobile with Virtual Keyboard Support */}
      <div
        style={viewportHeight && mobileView === 'chat' && typeof window !== 'undefined' && window.innerWidth < 768 ? { height: `${viewportHeight}px`, top: `${window.visualViewport?.offsetTop || 0}px` } : {}}
        className={`${mobileView === 'list' ? 'hidden md:flex md:flex-1' : 'fixed inset-0 z-50 bg-white flex flex-col h-full w-full md:static md:z-auto md:flex-1'} flex-col bg-white h-full overflow-hidden w-full`}
      >
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

        {/* 2. MESSAGES SECTION */}
        <div ref={chatStreamRef} className="chat-page__stream flex-1 p-3 sm:p-4 overflow-y-auto bg-gray-50 min-h-0">
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
            <div className="space-y-4">
              {/* Today Divider */}
              <div className="flex items-center justify-center my-4">
                <div className="bg-white px-3.5 py-1 rounded-full shadow-2xs border border-gray-200 text-xs font-semibold text-gray-600">
                  Today
                </div>
              </div>
              
              {filteredMessages.map((msg) => {
                const isMe = String(msg.sender) === String(currentUser?._id);

                return (
                  <div key={msg._id || msg.createdAt} className="space-y-1">
                    {isMe ? (
                      // My Messages - Right Side
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1.5 mb-1 text-xs">
                          {/* Show name+role only in group/all/team chat on mobile */}
                          <span className={`font-extrabold text-[#09233d] ${selectedRecipient.type === 'individual' ? 'hidden md:inline' : ''}`}>{msg.senderName || currentUser?.name || 'Me'}</span>
                          <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-100 text-[#20b875] uppercase ${selectedRecipient.type === 'individual' ? 'hidden md:inline' : ''}`}>
                            {msg.senderRole || currentUser?.role || 'EMPLOYEE'}
                          </span>
                          <span className="text-[11px] text-gray-400 font-medium">
                            {formatTime(msg.createdAt)}
                          </span>
                        </div>
                        <div className="max-w-[80%] md:max-w-[65%]">
                          <div className="bg-[#20b875] text-white rounded-2xl px-4 py-2.5 shadow-xs text-xs md:text-sm leading-relaxed break-words font-medium">
                            {msg.message}
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Other Messages - Left Side
                      <div className="flex flex-col items-start">
                        <div className="flex items-center gap-1.5 mb-1 text-xs">
                          {/* Show name+role only in group/all/team chat on mobile */}
                          <span className={`font-extrabold text-[#09233d] ${selectedRecipient.type === 'individual' ? 'hidden md:inline' : ''}`}>{msg.senderName || 'Staff'}</span>
                          <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-100 text-[#20b875] uppercase ${selectedRecipient.type === 'individual' ? 'hidden md:inline' : ''}`}>
                            {msg.senderRole || 'EMPLOYEE'}
                          </span>
                          <span className="text-[11px] text-gray-400 font-medium">
                            {formatTime(msg.createdAt)}
                          </span>
                        </div>
                        <div className="max-w-[80%] md:max-w-[65%]">
                          <div className="bg-white border border-gray-200 text-gray-800 rounded-2xl px-4 py-2.5 shadow-xs text-xs md:text-sm leading-relaxed break-words font-medium">
                            {msg.message}
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
        <div className="p-3 bg-white border-t border-gray-200 flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            className="p-2 text-gray-400 hover:text-[#20b875] hover:bg-emerald-50 rounded-full transition-colors shrink-0 cursor-pointer"
            title="Attach a file"
            aria-label="Attach a file"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6 rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.586-6.586a4 4 0 00-5.656-5.656l-6.586 6.586a6 6 0 108.485 8.485L20.5 13.5" />
            </svg>
          </button>
          
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
            placeholder={
              selectedRecipient.type === 'all'
                ? 'Type a broadcast message to everyone...'
                : selectedRecipient.type === 'team'
                ? `Type a team message to ${selectedRecipient.data?.name || 'team'}...`
                : `Type a direct message to ${selectedRecipient.data?.name || 'staff'}...`
            }
            className="flex-1 px-4 py-2.5 bg-white border border-gray-300 focus:border-[#20b875] rounded-xl text-xs md:text-sm text-[#09233d] font-medium outline-none placeholder:text-gray-400 transition-colors"
          />

          <button
            type="submit"
            disabled={sending || !newMessageText.trim()}
            onClick={handleSendMessage}
            className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-[#20b875] hover:bg-[#18995e] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center shrink-0 shadow-sm transition-all cursor-pointer"
            title="Send Message"
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 text-white pl-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
