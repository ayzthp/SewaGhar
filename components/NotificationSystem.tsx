"use client"

import type React from "react"

import { useEffect } from "react"
import { onValue, ref } from "firebase/database"
import { db, auth } from "@/lib/firebase"

const NotificationSystem: React.FC = () => {
  useEffect(() => {
    if (!auth.currentUser) return

    const unreadCountsRef = ref(db, `unreadCounts/${auth.currentUser.uid}`)
    const unsubscribe = onValue(unreadCountsRef, (snapshot) => {
      const unreadCounts = snapshot.val()
      if (unreadCounts) {
        Object.entries(unreadCounts).forEach(([requestId, count]) => {
          if (count > 0) {
            showNotification(requestId, count as number)
          }
        })
      }
    })

    return () => unsubscribe()
  }, [])

  const showNotification = (requestId: string, count: number) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("New Message", {
        body: `You have ${count} unread message${count > 1 ? "s" : ""} in request ${requestId}`,
      })
    }
  }

  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission()
    }
  }, [])

  return null
}

export default NotificationSystem

