import React, { useState, useEffect, useRef } from 'react';
import { fetchApi } from '../../config/api';

export default function TeamChatPage({ currentUser }) {
  const [staffList, setStaffList] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState({ type: 'all', data: null }); // type: 'all' | 'individual'
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessageText, setNewMessageText] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);

  // Fetch all staff members
  useEffect(() => {
    fetchApi('/employees')
      .then((res) => setStaffList(res.data || []))
      .catch((err) => console.error('Failed to load staff list:', err));
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

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedRecipient]);

  // Filter messages for active selection
  const filteredMessages = messages.filter((msg) => {
    if (selectedRecipient.type === 'all') {
      return msg.recipientType === 'all';
    } else if (selectedRecipient.type === 'individual' && selectedRecipient.data) {
      const targetId = selectedRecipient.data._id;
      return (
        msg.recipientType === 'individual' &&
        ((msg.sender === currentUser?._id && msg.recipientId === targetId) ||
         (msg.sender === targetId && msg.recipientId === currentUser?._id))
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

      const res = await fetchApi('/chat/send', {
        method: 'POST',
        body: JSON.stringify({
          recipientType,
          recipientId,
          recipientName,
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

  const filteredStaff = staffList.filter((emp) =>
    emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (emp.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (emp.employeeId || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-[calc(100vh-6rem)] bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden flex flex-col md:flex-row">
      {/* LEFT PANEL: Persons & Group Conversations List */}
      <div className="w-full md:w-80 bg-slate-50 border-r border-gray-200 flex flex-col shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <h2 className="text-base font-black text-[#09233d] flex items-center gap-2">
            Team Messaging Hub
            <span className="w-2 h-2 rounded-full bg-[#20b875] animate-pulse" />
          </h2>
          <p className="text-xs text-gray-500 font-medium">Select group or individual to chat</p>
        </div>

        {/* Group Broadcast Option */}
        <div className="p-3 border-b border-gray-200">
          <button
            type="button"
            onClick={() => setSelectedRecipient({ type: 'all', data: null })}
            className={`w-full p-3 rounded-xl font-bold text-xs text-left transition-all flex items-center justify-between cursor-pointer ${
              selectedRecipient.type === 'all'
                ? 'bg-[#09233d] text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-emerald-50 border border-gray-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#20b875] text-white flex items-center justify-center font-bold text-sm shrink-0">
                📢
              </div>
              <div>
                <span className="block font-black text-xs">Everyone (Group Broadcast)</span>
                <span className={`block text-[10px] font-medium ${selectedRecipient.type === 'all' ? 'text-emerald-300' : 'text-gray-400'}`}>
                  Public Team Announcements
                </span>
              </div>
            </div>
            {selectedRecipient.type === 'all' && (
              <span className="w-2.5 h-2.5 rounded-full bg-[#20b875] shrink-0" />
            )}
          </button>
        </div>

        {/* Staff Search Box */}
        <div className="p-3 border-b border-gray-200 bg-white">
          <div className="relative">
            <input
              type="text"
              placeholder="Search employee by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-[#09233d] font-medium focus:bg-white focus:border-[#20b875] outline-none"
            />
            <svg className="w-4 h-4 text-gray-400 absolute left-2.5 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Individual Staff List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-2 py-1 text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
            Individual Staff ({filteredStaff.length})
          </div>

          {filteredStaff.map((emp) => {
            const isSelected =
              selectedRecipient.type === 'individual' &&
              selectedRecipient.data?._id === emp._id;

            return (
              <button
                key={emp._id}
                type="button"
                onClick={() => setSelectedRecipient({ type: 'individual', data: emp })}
                className={`w-full p-2.5 rounded-xl text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-white hover:bg-slate-100 text-[#09233d] border border-gray-100'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      isSelected
                        ? 'bg-white text-purple-700'
                        : 'bg-emerald-100 text-[#20b875]'
                    }`}
                  >
                    {emp.name ? emp.name.charAt(0).toUpperCase() : 'E'}
                  </div>
                  <div className="truncate">
                    <span className="block text-xs font-bold truncate">{emp.name}</span>
                    <span
                      className={`block text-[10px] font-medium truncate ${
                        isSelected ? 'text-purple-200' : 'text-gray-400'
                      }`}
                    >
                      @{emp.username || emp.employeeId || 'staff'}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase shrink-0 ${
                    isSelected
                      ? 'bg-purple-800 text-white'
                      : 'bg-gray-100 text-gray-600'
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
      <div className="flex-1 flex flex-col bg-white">
        {/* Active Conversation Header */}
        <div className="p-4 bg-[#09233d] text-white flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                selectedRecipient.type === 'all' ? 'bg-[#20b875]' : 'bg-purple-600'
              }`}
            >
              {selectedRecipient.type === 'all' ? '📢' : '👤'}
            </div>
            <div>
              <h3 className="text-sm font-black text-white">
                {selectedRecipient.type === 'all'
                  ? 'Everyone (Group Broadcast Chat)'
                  : `Direct Chat: ${selectedRecipient.data?.name}`}
              </h3>
              <p className="text-[11px] text-gray-300 font-medium">
                {selectedRecipient.type === 'all'
                  ? 'All staff members receive and see messages in this channel'
                  : `Private 1-on-1 conversation with ${selectedRecipient.data?.name} (${selectedRecipient.data?.username || 'Staff'})`}
              </p>
            </div>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50/60">
          {loadingMessages && messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-xs text-gray-400 font-medium">
              Loading chat history...
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 text-gray-400">
              <span className="text-4xl mb-2">💬</span>
              <p className="text-sm font-bold text-gray-700">No messages in this chat yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Type a message below to start the conversation!
              </p>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isMe = msg.sender === currentUser?._id;

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
                          : msg.senderRole === 'superior'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-emerald-100 text-emerald-700'
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
                        ? 'bg-[#09233d] text-white rounded-tr-none'
                        : selectedRecipient.type === 'all'
                        ? 'bg-white text-gray-800 border border-emerald-200 rounded-tl-none'
                        : 'bg-purple-50 text-purple-950 border border-purple-200 rounded-tl-none'
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
        <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-200 flex items-center gap-2 shrink-0">
          <input
            type="text"
            value={newMessageText}
            onChange={(e) => setNewMessageText(e.target.value)}
            placeholder={
              selectedRecipient.type === 'all'
                ? 'Type a broadcast message to everyone...'
                : `Type a direct message to ${selectedRecipient.data?.name}...`
            }
            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-[#20b875] focus:bg-white rounded-xl text-xs text-[#09233d] font-medium outline-none transition-all"
          />
          <button
            type="submit"
            disabled={sending || !newMessageText.trim()}
            className="px-5 py-2.5 bg-[#20b875] hover:bg-[#18995e] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            {sending ? (
              <span>Sending...</span>
            ) : (
              <>
                <span>Send Message</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
