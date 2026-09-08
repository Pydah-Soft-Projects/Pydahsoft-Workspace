import React, { useState, useEffect, useRef } from 'react';
import { fetchApi } from '../../config/api';

export default function DashboardChatBox({ currentUser, employeeList = [] }) {
  const [messages, setMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [staffList, setStaffList] = useState(employeeList);
  
  // Recipient selection: 'all' or specific employee _id
  const [targetType, setTargetType] = useState('all'); // 'all' | 'individual'
  const [selectedEmpId, setSelectedEmpId] = useState('');
  
  const messagesEndRef = useRef(null);

  const isSuperiorOrAdmin =
    currentUser?.role === 'superadmin' ||
    currentUser?.role === 'superior' ||
    currentUser?.role === 'admin';

  // Fetch staff list if empty
  useEffect(() => {
    if (employeeList && employeeList.length > 0) {
      setStaffList(employeeList);
    } else {
      fetchApi('/employees')
        .then((res) => setStaffList(res.data || []))
        .catch(() => {});
    }
  }, [employeeList]);

  // Load chat messages
  const loadMessages = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetchApi('/chat/messages');
      if (res.data) {
        setMessages(res.data);
      }
    } catch (err) {
      console.error('Failed to load chat messages:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Initial load + periodic live polling every 4 seconds
  useEffect(() => {
    loadMessages();
    const interval = setInterval(() => {
      loadMessages(true);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;

    setSending(true);
    try {
      let recipientType = 'all';
      let recipientId = undefined;
      let recipientName = undefined;

      if (targetType === 'individual' && selectedEmpId) {
        recipientType = 'individual';
        recipientId = selectedEmpId;
        const targetEmp = staffList.find((e) => e._id === selectedEmpId);
        recipientName = targetEmp ? targetEmp.name || targetEmp.username : 'Employee';
      }

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

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[480px] overflow-hidden">
      {/* Chat Header */}
      <div className="bg-[#09233d] px-5 py-3.5 flex items-center justify-between text-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-[#20b875]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Team Announcement & Direct Chat
              <span className="w-2 h-2 rounded-full bg-[#20b875] animate-pulse" />
            </h3>
            <p className="text-[11px] text-gray-300 font-medium">
              Broadcast messages to all staff or send direct messages to individuals
            </p>
          </div>
        </div>
      </div>

      {/* Recipient Target Selector Bar */}
      <div className="bg-slate-50 px-4 py-2.5 border-b border-gray-200 flex items-center gap-3 text-xs shrink-0 flex-wrap">
          <span className="font-extrabold text-[#09233d] uppercase text-[10px] tracking-wider shrink-0">
            Send Message To:
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setTargetType('all');
                setSelectedEmpId('');
              }}
              className={`px-3 py-1 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                targetType === 'all'
                  ? 'bg-[#20b875] text-white shadow-2xs'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <span>📢</span> Everyone (Group Broadcast)
            </button>

            <button
              type="button"
              onClick={() => setTargetType('individual')}
              className={`px-3 py-1 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                targetType === 'individual'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <span>👤</span> Specific Employee
            </button>
          </div>

          {targetType === 'individual' && (
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="px-2.5 py-1 bg-white border border-purple-300 rounded-xl text-xs font-semibold text-[#09233d] focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="">-- Select Recipient / Staff Member --</option>
              {staffList.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name} ({emp.username || emp.employeeId || 'Staff'})
                </option>
              ))}
            </select>
          )}
        </div>

      {/* Message Stream Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50/50">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-gray-400 font-medium">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-400">
            <svg className="w-10 h-10 mb-2 opacity-40 text-[#20b875]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-xs font-bold text-gray-600">No messages yet</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Start a conversation or broadcast an announcement to your team!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender === currentUser?._id;
            const isBroadcast = msg.recipientType === 'all';

            return (
              <div
                key={msg._id || msg.createdAt}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                {/* Sender Info & Badges */}
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

                  {/* Target Badge */}
                  {isBroadcast ? (
                    <span className="text-[9px] font-bold bg-emerald-50 text-[#20b875] px-1.5 py-0.2 rounded-md border border-emerald-200">
                      📢 Broadcast
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold bg-purple-50 text-purple-700 px-1.5 py-0.2 rounded-md border border-purple-200">
                      🔒 Direct to {msg.recipientName || 'Employee'}
                    </span>
                  )}

                  <span className="text-[10px] text-gray-400 font-medium ml-1">
                    {formatTime(msg.createdAt)}
                  </span>
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs font-medium leading-relaxed shadow-2xs ${
                    isMe
                      ? 'bg-[#09233d] text-white rounded-tr-none'
                      : isBroadcast
                      ? 'bg-white text-gray-800 border border-emerald-200/80 rounded-tl-none shadow-xs'
                      : 'bg-purple-50/90 text-purple-950 border border-purple-200 rounded-tl-none shadow-xs'
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

      {/* Message Input Box */}
      <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex items-center gap-2 shrink-0">
        <input
          type="text"
          value={newMessageText}
          onChange={(e) => setNewMessageText(e.target.value)}
          placeholder={
            targetType === 'individual' && selectedEmpId
              ? `Direct message to selected employee...`
              : `Broadcast a message to everyone...`
          }
          className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 focus:border-[#20b875] focus:bg-white rounded-xl text-xs text-[#09233d] font-medium outline-none transition-all placeholder:text-gray-400"
        />
        <button
          type="submit"
          disabled={sending || !newMessageText.trim() || (targetType === 'individual' && !selectedEmpId)}
          className="px-4 py-2 bg-[#20b875] hover:bg-[#199d63] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          {sending ? (
            <span>Sending...</span>
          ) : (
            <>
              <span>Send</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
