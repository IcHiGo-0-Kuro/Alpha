package com.alpha.android

import java.time.DayOfWeek
import java.time.Duration
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.ZoneId
import java.time.ZonedDateTime

/** Native counterpart of Alpha's shared schedule concept. */
data class LocalSchedule(
    val id: String,
    val name: String,
    val unlockTime: LocalTime,
    val durationMinutes: Long,
    val repeatType: RepeatType,
    val repeatDays: Set<DayOfWeek> = emptySet(),
    val timezone: ZoneId,
    val enabled: Boolean = true,
    val apps: List<String> = emptyList(),
)

enum class RepeatType { DAILY, WEEKDAYS, WEEKENDS, CUSTOM }

data class ScheduleEvaluation(
    val restricted: Boolean,
    val nextUnlock: ZonedDateTime?,
    val accessEndsAt: ZonedDateTime?,
)

object ScheduleEngine {
    fun evaluate(schedule: LocalSchedule, now: ZonedDateTime): ScheduleEvaluation {
        if (!schedule.enabled) return ScheduleEvaluation(true, null, null)
        val localNow = now.withZoneSameInstant(schedule.timezone)
        val candidates = (-1L..8L).map { localNow.toLocalDate().plusDays(it) }

        for (date in candidates) {
            if (!matches(schedule, date.dayOfWeek)) continue
            val start = ZonedDateTime.of(LocalDateTime.of(date, schedule.unlockTime), schedule.timezone)
            val end = start.plusMinutes(schedule.durationMinutes)
            if (!localNow.isBefore(start) && localNow.isBefore(end)) {
                return ScheduleEvaluation(false, start, end)
            }
        }

        val next = candidates
            .mapNotNull { date ->
                if (!matches(schedule, date.dayOfWeek)) return@mapNotNull null
                ZonedDateTime.of(LocalDateTime.of(date, schedule.unlockTime), schedule.timezone)
            }
            .firstOrNull { it.isAfter(localNow) }

        return ScheduleEvaluation(true, next, null)
    }

    fun countdown(target: ZonedDateTime, now: ZonedDateTime): Duration =
        Duration.between(now, target).coerceAtLeast(Duration.ZERO)

    private fun matches(schedule: LocalSchedule, day: DayOfWeek): Boolean = when (schedule.repeatType) {
        RepeatType.DAILY -> true
        RepeatType.WEEKDAYS -> day <= DayOfWeek.FRIDAY
        RepeatType.WEEKENDS -> day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY
        RepeatType.CUSTOM -> day in schedule.repeatDays
    }

    private fun Duration.coerceAtLeast(minimum: Duration): Duration =
        if (isNegative) minimum else this
}
