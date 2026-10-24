package com.smartpc.modules.product.event;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ProductSavedEvent {
    private final String productId;
}
