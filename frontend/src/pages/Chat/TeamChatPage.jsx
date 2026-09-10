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
    const matchesSearch =
      emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.employeeId || '').toLowerCase().includes(searchQuery.toLowerCase());

    const role = (emp.role || 'employee').toLowerCase();
    if (roleFilter === 'admin') {
      return matchesSearch && (role.includes('admin') || role.includes('super'));
    } else if (roleFilter === 'lead') {
      return matchesSearch && (role.includes('superior') || role.includes('lead') || role.includes('manager'));
    } else if (roleFilter === 'employee') {
      return matchesSearch && (role.includes('employee') || role === 'staff' || role === '' || (!role.includes('admin') && !role.includes('super') && !role.includes('lead')));
    }
    return matchesSearch;
  });

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-page h-full min-h-0 bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden flex flex-col md:flex-row">
      {/* LEFT PANEL: Persons & Group Conversations List */}
      <div className={`${mobileView === 'chat' ? 'hidden md:flex' : 'flex'} chat-page__contacts w-full md:w-80 bg-slate-50 border-r border-gray-200 flex-col shrink-0 h-full overflow-y-auto md:overflow-hidden`}>
        {/* Header */}
        <div className="chat-page__contacts-header p-4 border-b border-gray-200 bg-white">
          <h2 className="text-base font-black text-[#09233d] flex items-center gap-2">
            Team Messaging Hub
            <span className="w-2.5 h-2.5 rounded-full bg-[#20b875] animate-pulse" />
          </h2>
          <p className="text-xs text-gray-500 font-medium">Select group, team, or staff member to chat</p>
        </div>

        {/* Global Broadcast Option */}
        <div className="p-3 border-b border-gray-200">
          <button
            type="button"
            onClick={() => {
              setSelectedRecipient({ type: 'all', data: null });
              setMobileView('chat');
            }}
            className={`w-full p-3 rounded-xl font-bold text-xs text-left transition-all flex items-center justify-between cursor-pointer ${
              selectedRecipient.type === 'all'
                ? 'bg-emerald-50 text-[#09233d] border-[#20b875] shadow-xs'
                : 'bg-white text-gray-700 hover:bg-emerald-50/50 border border-gray-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#20b875] text-white flex items-center justify-center font-bold text-sm shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <div>
                <span className="block font-black text-xs text-[#09233d]">Everyone (Company Broadcast)</span>
                <span className="block text-[10px] font-medium text-gray-500">
                  Public All-Staff Announcements
                </span>
              </div>
            </div>
            {selectedRecipient.type === 'all' && (
              <span className="w-2.5 h-2.5 rounded-full bg-[#20b875] shrink-0" />
            )}
          </button>
        </div>

        {/* Teams List (Team Broadcasts) */}
        {teamsList.length > 0 && (
          <div className="px-3 pt-3 pb-1 border-b border-gray-200">
            <div className="px-1 mb-1 text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
              Teams & Departments ({teamsList.length})
            </div>
            <div className="space-y-1 max-h-36 overflow-y-auto">
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
                    className={`w-full p-2 rounded-xl text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 text-[#09233d] border-[#20b875] shadow-xs'
                        : 'bg-white hover:bg-emerald-50/50 text-[#09233d] border border-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <svg className="w-4 h-4 shrink-0 text-[#20b875]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span className="truncate text-xs font-bold text-[#09233d]">{team.name}</span>
                    </div>
                    <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-md bg-emerald-100 text-[#20b875]">
                      Team
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Role Filter Pills */}
        <div className="px-3 py-2.5 flex items-center gap-1.5 overflow-x-auto bg-slate-50 border-b border-gray-200 shrink-0">
          <button
            type="button"
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              roleFilter === 'all'
                ? 'bg-[#20b875] text-white shadow-2xs'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
            }`}
          >
            All ({staffList.length})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('admin')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              roleFilter === 'admin'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
            }`}
          >
            Admins
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('lead')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              roleFilter === 'lead'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
            }`}
          >
            Team Leads
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('employee')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              roleFilter === 'employee'
                ? 'bg-[#20b875] text-white shadow-2xs'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
            }`}
          >
            Employees
          </button>
        </div>

        {/* Staff Search Box */}
        <div className="chat-page__search p-3 border-b border-gray-200 bg-white shrink-0">
          <div className="relative">
            <input
              type="text"
              placeholder="Search staff, leads, or superadmin..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              inputMode="search"
              autoComplete="off"
              aria-label="Search contacts"
              className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-[#09233d] font-medium focus:bg-white focus:border-[#20b875] outline-none"
            />
            <svg className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Individual Contact Directory List */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 min-h-[160px]">
          <div className="px-2 py-1 text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
            Direct 1-on-1 Contacts ({filteredStaff.length})
          </div>

          {filteredStaff.map((emp) => {
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
                className={`w-full p-2.5 rounded-xl text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-50 text-[#09233d] border-[#20b875] shadow-xs'
                    : 'bg-white hover:bg-emerald-50/40 text-[#09233d] border border-gray-100'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 bg-emerald-100 text-[#20b875]"
                  >
                    {emp.name ? emp.name.charAt(0).toUpperCase() : 'E'}
                  </div>
                  <div className="truncate">
                    <span className="block text-xs font-bold truncate text-[#09233d]">
                      {emp.name} {isMe && '(You)'}
                    </span>
                    <span className="block text-[10px] font-medium truncate text-gray-400">
                      @{emp.username || emp.employeeId || 'staff'}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase shrink-0 ${
                    emp.role === 'superadmin' || emp.role === 'admin'
                      ? 'bg-rose-100 text-rose-700'
                      : emp.role === 'superior' || emp.role === 'teamlead'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-emerald-50 text-[#20b875]'
                  }`}
                >
                  {emp.role || 'Staff'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT PANEL: Chat Stream & Message Input */}
      <div
        style={viewportHeight && mobileView === 'chat' && typeof window !== 'undefined' && window.innerWidth < 768 ? { height: `${viewportHeight}px`, top: `${window.visualViewport?.offsetTop || 0}px` } : {}}
        className={`${mobileView === 'list' ? 'hidden md:flex md:flex-1' : 'fixed inset-0 z-50 bg-white flex flex-col h-full w-full md:static md:z-auto md:flex-1'} flex-col bg-white h-full overflow-hidden w-full`}
      >
        {/* Active Conversation Header */}
        <div className="p-3 md:p-4 bg-white border-b border-gray-200 flex items-center justify-between shrink-0 shadow-2xs">
          <div className="flex items-center gap-2.5 md:gap-3 truncate">
            {/* Mobile Back Button */}
            <button
              type="button"
              onClick={() => setMobileView('list')}
              className="md:hidden p-2 text-gray-600 hover:text-[#09233d] hover:bg-gray-100 rounded-xl transition-all shrink-0 cursor-pointer flex items-center gap-1 font-bold text-xs border border-gray-200"
              title="Back to contacts list"
            >
              <svg className="w-4 h-4 text-[#20b875]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Chats</span>
            </button>

            <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-emerald-50 text-[#20b875] border border-emerald-100 flex items-center justify-center font-black text-sm md:text-base shrink-0 shadow-2xs">
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
              <h3 className="text-xs md:text-sm font-black text-[#09233d] truncate">
                {selectedRecipient.type === 'all'
                  ? 'Everyone'
                  : selectedRecipient.type === 'team'
                  ? selectedRecipient.data?.name
                  : selectedRecipient.data?.name}
              </h3>
              <p className="text-[10px] md:text-[11px] text-gray-500 font-medium truncate">
                {selectedRecipient.type === 'all'
                  ? 'Company broadcast channel'
                  : selectedRecipient.type === 'team'
                  ? 'Team conversation'
                  : `Private conversation · ${selectedRecipient.data?.role || 'Staff'}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              className="p-2 text-gray-500 hover:text-[#20b875] hover:bg-emerald-50 rounded-full transition-colors"
              title="Start video call"
              aria-label="Start video call"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              type="button"
              className="p-2 text-gray-500 hover:text-[#20b875] hover:bg-emerald-50 rounded-full transition-colors"
              title="Start voice call"
              aria-label="Start voice call"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 5a2 2 0 012-2h2.28a1 1 0 01.95.684l1.1 3.3a1 1 0 01-.27 1.04L7.6 9.49a16 16 0 006.91 6.91l1.46-1.46a1 1 0 011.04-.27l3.3 1.1A1 1 0 0121 16.72V19a2 2 0 01-2 2h-1C9.16 21 3 14.84 3 7V5z" />
              </svg>
            </button>
            <button
              type="button"
              className="p-2 text-gray-500 hover:text-[#20b875] hover:bg-emerald-50 rounded-full transition-colors"
              title="Chat options"
              aria-label="Chat options"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div ref={chatStreamRef} className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
          {loadingMessages && messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-xs text-gray-400 font-medium">
              Loading chat history...
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 text-gray-400">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#20b875] flex items-center justify-center mb-3 shadow-2xs border border-emerald-100">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm font-bold text-gray-700">No messages in this conversation yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Type a message below to start chatting!
              </p>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isMe = String(msg.sender) === String(currentUser?._id);

              return (
                <div
                  key={msg._id || msg.createdAt}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px]">
                    <span className="font-bold text-[#09233d]">{msg.senderName}</span>
                    <span
                      className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-md ${
                        msg.senderRole === 'superadmin' || msg.senderRole === 'admin'
                          ? 'bg-rose-100 text-rose-700'
                          : msg.senderRole === 'superior' || msg.senderRole === 'teamlead'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-emerald-100 text-[#20b875]'
                      }`}
                    >
                      {msg.senderRole}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium ml-1">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>

                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs font-medium leading-relaxed shadow-2xs ${
                      isMe
                        ? 'bg-[#20b875] text-white rounded-tr-none'
                        : 'bg-white text-gray-800 border border-emerald-100 rounded-tl-none shadow-2xs'
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Form */}
        <form onSubmit={handleSendMessage} className="chat-page__composer sticky bottom-0 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-white border-t border-gray-200 flex items-center gap-2 shrink-0 z-10">
          <button
            type="button"
            className="p-2 text-gray-400 hover:text-[#20b875] hover:bg-emerald-50 rounded-full transition-colors shrink-0"
            title="Attach a file"
            aria-label="Attach a file"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.586-6.586a4 4 0 00-5.656-5.656l-6.586 6.586a6 6 0 108.485 8.485L20.5 13.5" />
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
            onFocus={() => {
              setTimeout(() => {
                window.scrollTo(0, 0);
                if (chatStreamRef.current) {
                  chatStreamRef.current.scrollTop = chatStreamRef.current.scrollHeight;
                }
              }, 100);
            }}
            placeholder={
              selectedRecipient.type === 'all'
                ? 'Type a broadcast message to everyone...'
                : selectedRecipient.type === 'team'
                ? `Type a team message to ${selectedRecipient.data?.name}...`
                : `Type a direct message to ${selectedRecipient.data?.name}...`
            }
            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-[#20b875] focus:bg-white rounded-xl text-xs text-[#09233d] font-medium outline-none transition-all"
          />
          <button
            type="submit"
            disabled={sending || !newMessageText.trim()}
            className="w-10 h-10 rounded-full bg-[#20b875] hover:bg-[#18995e] active:scale-95 disabled:opacity-40 text-white flex items-center justify-center shrink-0 shadow-md transition-all cursor-pointer"
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
        </form>
      </div>
    </div>
  );
}
