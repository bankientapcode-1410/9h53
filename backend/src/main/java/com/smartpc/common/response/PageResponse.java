package com.smartpc.common.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;

import java.util.Collections;
import java.util.List;
import java.util.function.Function;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageResponse<T> {

    @Builder.Default
    private List<T> content = Collections.emptyList();

    private int page;

    private int size;

    @JsonProperty("total_elements")
    private long totalElements;

    @JsonProperty("total_pages")
    private int totalPages;

    private boolean first;

    private boolean last;

    public static <T> PageResponse<T> from(Page<T> page) {
        if (page == null) {
            return PageResponse.<T>builder()
                    .content(Collections.emptyList())
                    .page(0)
                    .size(0)
                    .totalElements(0)
                    .totalPages(0)
                    .first(true)
                    .last(true)
                    .build();
        }
        return PageResponse.<T>builder()
                .content(page.getContent())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }

    public static <S, T> PageResponse<T> from(Page<S> page, Function<S, T> mapper) {
        if (page == null) {
            return PageResponse.<T>builder()
                    .content(Collections.emptyList())
                    .page(0)
                    .size(0)
                    .totalElements(0)
                    .totalPages(0)
                    .first(true)
                    .last(true)
                    .build();
        }
        List<T> mappedContent = page.getContent().stream().map(mapper).toList();
        return PageResponse.<T>builder()
                .content(mappedContent)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }
}
