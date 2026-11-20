package com.banking.transactionservice.exception;

/**
 * Another service failed or was unreachable during the SAGA (HTTP 502), e.g. account-service is down
 * while deducting the sender. The client gets a generic message; the cause is kept for the logs.
 * <pre>{@code
 * try {
 *     accountClient.deductBalance(request.senderAccountNumber(), request.amount());
 * } catch (FeignException e) {
 *     throw new DownstreamServiceException("account-service", "deduct balance", e);
 * }
 * }</pre>
 * Business errors returned by account-service (e.g. 422 INSUFFICIENT_BALANCE) should be passed on to
 * the client with their own code, not wrapped in this exception - see a Feign ErrorDecoder for that.
 */
public class DownstreamServiceException extends BusinessException {

    public DownstreamServiceException(String service, String operation, Throwable cause) {
        super(ErrorCode.DOWNSTREAM_SERVICE_ERROR, "Could not " + operation + ": " + service + " is unavailable");
        initCause(cause);
    }
}
