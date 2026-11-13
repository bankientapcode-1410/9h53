package com.smartpc.modules.ruleengine;

import com.smartpc.common.response.ApiResponse;
import com.smartpc.common.response.PageResponse;
import com.smartpc.modules.ruleengine.controller.CompatRuleAdminController;
import com.smartpc.modules.ruleengine.dto.request.RuleFilterCriteria;
import com.smartpc.modules.ruleengine.dto.response.CompatRuleDTO;
import com.smartpc.modules.ruleengine.service.CompatRuleAdminService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CompatRuleAdminControllerTest {

    @Mock
    private CompatRuleAdminService ruleAdminService;

    private CompatRuleAdminController controller;

    @BeforeEach
    void setUp() {
        controller = new CompatRuleAdminController(ruleAdminService);
    }

    @Test
    @DisplayName("TC-RE-22: Kẹp phân trang page >= 0 và size [1..100]")
    void testPaginationClamping() {
        PageResponse<CompatRuleDTO> mockResponse = PageResponse.<CompatRuleDTO>builder()
                .content(Collections.emptyList())
                .page(0)
                .size(100)
                .totalElements(0)
                .totalPages(0)
                .build();

        when(ruleAdminService.getRules(any(RuleFilterCriteria.class), any(Pageable.class)))
                .thenReturn(mockResponse);

        // Call with negative page and excessive size
        ApiResponse<PageResponse<CompatRuleDTO>> response = controller.getAllRules(
                null, null, null, null, null, -5, 999999
        );

        assertNotNull(response);
        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(ruleAdminService).getRules(any(), captor.capture());

        Pageable captured = captor.getValue();
        assertEquals(0, captured.getPageNumber(), "Page âm phải được kẹp về 0");
        assertEquals(100, captured.getPageSize(), "Size quá lớn phải được kẹp về tối đa 100");
    }
}
