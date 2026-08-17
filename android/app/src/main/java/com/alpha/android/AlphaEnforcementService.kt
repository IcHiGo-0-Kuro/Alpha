package com.alpha.android

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder

class AlphaEnforcementService : Service() {
    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, notification())
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Phase 2 will load the locally cached Supabase schedule and evaluate it here.
        // The service boundary is intentionally persistent so enforcement can survive
        // the dashboard being closed.
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun notification(): Notification =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, CHANNEL_ID)
                .setContentTitle("Alpha")
                .setContentText("Scheduled access control is active")
                .setSmallIcon(android.R.drawable.ic_lock_lock)
                .setOngoing(true)
                .build()
        } else {
            Notification.Builder(this)
                .setContentTitle("Alpha")
                .setContentText("Scheduled access control is active")
                .setSmallIcon(android.R.drawable.ic_lock_lock)
                .setOngoing(true)
                .build()
        }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(
                NotificationChannel(
                    CHANNEL_ID,
                    "Alpha enforcement",
                    NotificationManager.IMPORTANCE_LOW,
                ),
            )
        }
    }

    companion object {
        private const val CHANNEL_ID = "alpha-enforcement"
        private const val NOTIFICATION_ID = 1001
    }
}
