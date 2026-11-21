package com.banking.transactionservice.exception;

/** The OTP sent for a PENDING_VERIFICATION transfer is wrong (HTTP 422); the client may retry. */
public class InvalidOtpException extends BusinessException {

    public InvalidOtpException(int attemptsLeft) {
        super(ErrorCode.INVALID_OTP, "Invalid OTP. Attempts left: " + attemptsLeft);
    }
}
