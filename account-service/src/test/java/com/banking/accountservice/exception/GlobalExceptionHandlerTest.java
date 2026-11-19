package com.banking.accountservice.exception;

import com.banking.accountservice.config.AccountProperties;
import com.banking.accountservice.controller.AccountController;
import com.banking.accountservice.service.AccountService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AccountController.class)
class GlobalExceptionHandlerTest {

    @TestConfiguration
    @EnableConfigurationProperties(AccountProperties.class)
    static class Config {
    }

    private static final String VALID_BODY = """
            {"email":"asha@example.com","phone":"9876543210","accountType":"SAVINGS",
             "accountHolderName":"Asha Rao","initialDeposit":5000}
            """;

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AccountService accountService;

    @Test
    void duplicateAccountReturns409WithErrorCode() throws Exception {
        given(accountService.createAccount(any()))
                .willThrow(new ResourceAlreadyExistsException("Account", "email", "asha@example.com"));

        mockMvc.perform(post("/api/v1/accounts/create").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.title").value("Resource already exists"))
                .andExpect(jsonPath("$.detail").value("Account already exists with email: asha@example.com"))
                .andExpect(jsonPath("$.errorCode").value("RESOURCE_ALREADY_EXISTS"))
                .andExpect(jsonPath("$.instance").value("/api/v1/accounts/create"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void unknownAccountReturns404() throws Exception {
        given(accountService.getAccount("AEGIS404"))
                .willThrow(new ResourceNotFoundException("Account", "accountNumber", "AEGIS404"));

        mockMvc.perform(get("/api/v1/accounts/AEGIS404"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value("RESOURCE_NOT_FOUND"))
                .andExpect(jsonPath("$.detail").value("Account not found with accountNumber: AEGIS404"));
    }

    @Test
    void insufficientBalanceReturns422() throws Exception {
        willThrow(new InsufficientBalanceException("AEGIS1", new BigDecimal("999.50")))
                .given(accountService).deductBalance(eq("AEGIS1"), any());

        mockMvc.perform(put("/api/v1/accounts/AEGIS1/deduct").param("amount", "999.50"))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.errorCode").value("INSUFFICIENT_BALANCE"));
    }

    @Test
    void invalidBodyReturns400WithEveryFieldError() throws Exception {
        String body = """
                {"email":"not-an-email","phone":"123","accountHolderName":"","initialDeposit":-5}
                """;

        mockMvc.perform(post("/api/v1/accounts/create").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.errors.email").value("Invalid email format"))
                .andExpect(jsonPath("$.errors.phone").exists())
                .andExpect(jsonPath("$.errors.accountType").value("Account type is required"))
                .andExpect(jsonPath("$.errors.accountHolderName").value("Account holder name is required"))
                .andExpect(jsonPath("$.errors.initialDeposit").value("Initial deposit cannot be negative"));
    }

    @Test
    void malformedJsonKeepsProblemDetailFormat() throws Exception {
        mockMvc.perform(post("/api/v1/accounts/create").contentType(MediaType.APPLICATION_JSON).content("{oops"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void unexpectedErrorReturns500WithoutLeakingDetails() throws Exception {
        given(accountService.getAccount("AEGIS1")).willThrow(new IllegalStateException("db password is hunter2"));

        mockMvc.perform(get("/api/v1/accounts/AEGIS1"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.errorCode").value("INTERNAL_ERROR"))
                .andExpect(jsonPath("$.detail").value(not(containsString("hunter2"))));
    }
}
