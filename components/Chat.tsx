"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { ref, push, onValue, query, orderByChild, set, update } from "firebase/database"
import { db, auth } from "@/lib/firebase"
import type { ChatMessage } from "@/lib/firebase"
import { updateUnreadCount, resetUnreadCount } from "@/lib/firebase"

interface ChatProps {
  requestId: string
  otherUserId: string
}

const Chat: React.FC<ChatProps> = ({ requestId, otherUserId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [unreadCount, setUnreadCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const chatRef = ref(db, `chats/${requestId}`)
    const chatQuery = query(chatRef, orderByChild("timestamp"))

    const unsubscribe = onValue(chatQuery, (snapshot) => {
      const messagesData = snapshot.val()
      if (messagesData) {
        const messagesList = Object.values(messagesData) as ChatMessage[]
        setMessages(messagesList)

        // Mark messages as read
        messagesList.forEach((message) => {
          if (message.receiver_id === auth.currentUser?.uid && !message.read) {
            update(ref(db, `chats/${requestId}/${message.id}`), { read: true })
          }
        })

        // Reset unread count when opening the chat
        if (auth.currentUser) {
          resetUnreadCount(auth.currentUser.uid, requestId)
        }

        // Calculate unread count for the receiver
        const unreadMessages = messagesList.filter(
          (message) => message.receiver_id === auth.currentUser?.uid && !message.read,
        )
        setUnreadCount(unreadMessages.length)

        // Show notification for new messages
        const lastMessage = messagesList[messagesList.length - 1]
        if (lastMessage && lastMessage.sender_id === otherUserId && !lastMessage.read) {
          showNotification(lastMessage)
        }
      }
    })

    return () => unsubscribe()
  }, [requestId, otherUserId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !auth.currentUser) return

    const messageData: ChatMessage = {
      id: "",
      sender_id: auth.currentUser.uid,
      receiver_id: otherUserId,
      content: newMessage,
      timestamp: Date.now(),
      read: false,
    }

    try {
      const newMessageRef = push(ref(db, `chats/${requestId}`))
      messageData.id = newMessageRef.key || ""
      await set(newMessageRef, messageData)
      await updateUnreadCount(requestId, otherUserId, 1) // Update unread count for receiver only
      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  const showNotification = (message: ChatMessage) => {
    if ("Notification" in window && Notification.permission === "granted") {
      const senderName = message.sender_id === otherUserId ? "Provider" : "Customer"
      new Notification(`${senderName} texted you`, {
        body: message.content,
      })
    }
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md">
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ height: "400px" }}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender_id === auth.currentUser?.uid ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                message.sender_id === auth.currentUser?.uid ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"
              }`}
            >
              <p>{message.content}</p>
              <p className="text-xs mt-1 opacity-75">{new Date(message.timestamp).toLocaleString()}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 relative"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}

export default Chat

