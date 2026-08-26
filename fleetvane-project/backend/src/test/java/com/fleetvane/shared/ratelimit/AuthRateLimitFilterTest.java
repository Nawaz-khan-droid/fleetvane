package com.fleetvane.shared.ratelimit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;

class AuthRateLimitFilterTest {

    private MockHttpServletRequest post(String uri, String ip) {
        MockHttpServletRequest req = new MockHttpServletRequest("POST", uri);
        req.setRemoteAddr(ip);
        return req;
    }

    @Test
    @DisplayName("Allows up to capacity, then 429 with Retry-After; other paths untouched")
    void enforcesPerIpCapacity() throws Exception {
        AuthRateLimitFilter filter = new AuthRateLimitFilter(new RateLimitProperties(true, 3, 1));

        // 3 attempts pass on /api/auth/login
        for (int i = 0; i < 3; i++) {
            MockHttpServletResponse res = new MockHttpServletResponse();
            filter.doFilter(post("/api/auth/login", "10.0.0.1"), res, new MockFilterChain());
            assertThat(res.getStatus()).as("attempt %d", i + 1).isEqualTo(200);
        }

        // 4th is rejected with RFC-7807 style 429 + Retry-After
        MockHttpServletResponse blocked = new MockHttpServletResponse();
        filter.doFilter(post("/api/auth/login", "10.0.0.1"), blocked, new MockFilterChain());
        assertThat(blocked.getStatus()).isEqualTo(429);
        assertThat(blocked.getHeader("Retry-After")).isNotNull();
        assertThat(blocked.getContentAsString()).contains("Rate Limited");

        // Different IP has an independent bucket
        MockHttpServletResponse otherIp = new MockHttpServletResponse();
        filter.doFilter(post("/api/auth/login", "10.0.0.2"), otherIp, new MockFilterChain());
        assertThat(otherIp.getStatus()).isEqualTo(200);

        // Non-auth endpoints are never limited
        MockHttpServletResponse otherPath = new MockHttpServletResponse();
        filter.doFilter(post("/api/vehicles", "10.0.0.1"), otherPath, new MockFilterChain());
        assertThat(otherPath.getStatus()).isEqualTo(200);
    }

    @Test
    @DisplayName("Disabled via properties -> filter passes everything")
    void respectsEnabledFlag() throws Exception {
        AuthRateLimitFilter filter = new AuthRateLimitFilter(new RateLimitProperties(false, 1, 1));

        for (int i = 0; i < 5; i++) {
            MockHttpServletResponse res = new MockHttpServletResponse();
            filter.doFilter(post("/api/auth/login", "10.0.0.9"), res, new MockFilterChain());
            assertThat(res.getStatus()).isEqualTo(200);
        }
    }

    @Test
    @DisplayName("X-Forwarded-For first hop wins over remoteAddr (proxy-aware keying)")
    void honoursForwardedFor() throws Exception {
        AuthRateLimitFilter filter = new AuthRateLimitFilter(new RateLimitProperties(true, 1, 1));

        MockHttpServletRequest req = post("/api/auth/signup", "192.168.1.1");
        req.addHeader("X-Forwarded-For", "203.0.113.7, 10.0.0.3");

        MockHttpServletResponse first = new MockHttpServletResponse();
        filter.doFilter(req, first, new MockFilterChain());
        assertThat(first.getStatus()).isEqualTo(200);

        // Same forwarded client -> second request blocked even though remoteAddr differs
        MockHttpServletRequest sameClient = post("/api/auth/signup", "192.168.1.99");
        sameClient.addHeader("X-Forwarded-For", "203.0.113.7");
        MockHttpServletResponse second = new MockHttpServletResponse();
        filter.doFilter(sameClient, second, new MockFilterChain());
        assertThat(second.getStatus()).isEqualTo(429);
    }
}
