"""
Asymmetric Kalman Filter & Hysteresis Smoothing Engine for EduTransit.
Prevents 'ETA Whiplash' where short-lived red light stops wildly fluctuate arrival times.
Enforces monotonic dampening and computes stable arrival confidence windows.
"""
import time
from typing import Tuple, Dict, Any, Optional

class AsymmetricKalmanFilter:
    def __init__(self,
                 process_variance: float = 1e-3,
                 measurement_variance_fast: float = 0.05,
                 measurement_variance_slow: float = 1.5):
        """
        Asymmetric Kalman filter where slowing down is filtered more conservatively
        than steady sustained motion, preventing single red light stops from causing panics.
        """
        self.q = process_variance
        self.r_fast = measurement_variance_fast
        self.r_slow = measurement_variance_slow
        self.state_estimates: Dict[str, float] = {}  # key -> estimated arrival seconds
        self.error_covariances: Dict[str, float] = {}
        self.last_update_times: Dict[str, float] = {}
        self.sustained_fast_counters: Dict[str, int] = {}

    def smooth_eta(self, key: str, raw_predicted_seconds: float, current_speed_kmh: float) -> Tuple[float, float, float]:
        """
        Smooth raw estimated travel seconds to target stop.
        Returns:
            (smoothed_seconds, confidence_min_seconds, confidence_max_seconds)
        """
        now = time.time()
        if key not in self.state_estimates:
            self.state_estimates[key] = raw_predicted_seconds
            self.error_covariances[key] = 1.0
            self.last_update_times[key] = now
            self.sustained_fast_counters[key] = 0
            
            # Initial confidence window (+/- 90 seconds)
            min_sec = max(0.0, raw_predicted_seconds - 90.0)
            max_sec = raw_predicted_seconds + 90.0
            return raw_predicted_seconds, min_sec, max_sec

        prev_est = self.state_estimates[key]
        p_prev = self.error_covariances[key]
        
        # Predict step
        p_pred = p_prev + self.q
        
        # Asymmetric R selection:
        # If new ETA is longer (bus slowed down), be conservative (high R) unless sustained.
        # If bus is moving at healthy speed (>25 km/h), speed recovery decreases R.
        if raw_predicted_seconds > prev_est:
            # Delay detected
            r = self.r_slow
            self.sustained_fast_counters[key] = max(0, self.sustained_fast_counters[key] - 1)
        else:
            # Faster arrival detected
            if current_speed_kmh > 20.0:
                self.sustained_fast_counters[key] += 1
                if self.sustained_fast_counters[key] > 3:
                    r = self.r_fast
                else:
                    r = self.r_slow
            else:
                r = self.r_slow

        # Kalman Gain
        k = p_pred / (p_pred + r)
        
        # Update step
        new_est = prev_est + k * (raw_predicted_seconds - prev_est)
        new_p = (1.0 - k) * p_pred
        
        self.state_estimates[key] = new_est
        self.error_covariances[key] = new_p
        self.last_update_times[key] = now
        
        # Calculate dynamic confidence interval
        margin = max(60.0, min(240.0, new_est * 0.12))
        min_sec = max(0.0, new_est - margin)
        max_sec = new_est + margin
        
        return round(new_est, 1), round(min_sec, 1), round(max_sec, 1)

# Singleton global smoother
eta_smoother = AsymmetricKalmanFilter()
