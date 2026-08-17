package com.alpha.android

import android.app.admin.DevicePolicyManager
import android.content.Context

class RestrictionEngine(private val context: Context) {
    enum class EnforcementStatus(val label: String) {
        SUPPORTED("Enforcement supported: managed-device/profile-owner mode"),
        UNSUPPORTED("Enforcement unavailable: device-owner/profile-owner setup is required"),
    }

    fun capabilityStatus(): EnforcementStatus {
        val dpm = context.getSystemService(DevicePolicyManager::class.java)
        val packageName = context.packageName
        return if (dpm.isDeviceOwnerApp(packageName) || dpm.isProfileOwnerApp(packageName)) {
            EnforcementStatus.SUPPORTED
        } else {
            EnforcementStatus.UNSUPPORTED
        }
    }

    fun setPackagesRestricted(packageNames: Collection<String>, restricted: Boolean): Result<Unit> {
        val dpm = context.getSystemService(DevicePolicyManager::class.java)
        if (!dpm.isDeviceOwnerApp(context.packageName) && !dpm.isProfileOwnerApp(context.packageName)) {
            return Result.failure(UnsupportedOperationException("Alpha is not a device owner/profile owner"))
        }

        return runCatching {
            dpm.setPackagesSuspended(
                context.adminReceiverComponent(),
                packageNames.toTypedArray(),
                restricted,
            )
        }.map { Unit }
    }
}

private fun Context.adminReceiverComponent() =
    android.content.ComponentName(this, AlphaDeviceAdminReceiver::class.java)
