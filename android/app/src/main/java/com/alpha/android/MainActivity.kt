package com.alpha.android

import android.app.Activity
import android.os.Bundle
import android.view.Gravity
import android.widget.LinearLayout
import android.widget.TextView

class MainActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val status = RestrictionEngine(this).capabilityStatus()
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(48, 48, 48, 48)
        }

        val title = TextView(this).apply {
            text = "Alpha"
            textSize = 32f
            gravity = Gravity.CENTER
        }
        val subtitle = TextView(this).apply {
            text = "Scheduled access control"
            textSize = 18f
            gravity = Gravity.CENTER
        }
        val capability = TextView(this).apply {
            text = status.label
            textSize = 16f
            gravity = Gravity.CENTER
            setPadding(0, 32, 0, 0)
        }

        root.addView(title)
        root.addView(subtitle)
        root.addView(capability)
        setContentView(root)
    }
}
