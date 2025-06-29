"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterSortPaginate = filterSortPaginate;
function getTimeField(time) {
    switch (time) {
        case '1h': return 'volume_1h';
        case '7d': return 'volume_7d';
        default: return 'volume_24h';
    }
}
function getPriceChangeField(time) {
    switch (time) {
        case '1h': return 'price_change_1h';
        case '7d': return 'price_change_7d';
        default: return 'price_change_24h';
    }
}
function getMarketCapField(time) {
    // Assume market cap is static or use a field if available
    return 'market_cap';
}
function parseSortParameter(sortParam, time) {
    const sortFields = [];
    const sortParts = sortParam.split(',').map(s => s.trim());
    for (const part of sortParts) {
        const isDescending = part.startsWith('-');
        const fieldName = isDescending ? part.substring(1) : part;
        const direction = isDescending ? 'desc' : 'asc';
        let field;
        switch (fieldName) {
            case 'volume':
                field = getTimeField(time);
                break;
            case 'priceChange':
                field = getPriceChangeField(time);
                break;
            case 'marketCap':
                field = getMarketCapField(time);
                break;
            default:
                // Handle unknown fields gracefully
                field = fieldName;
        }
        sortFields.push({ field, direction });
    }
    return sortFields;
}
function applyMultiFieldSort(tokens, sortFields) {
    return tokens.sort((a, b) => {
        for (const { field, direction } of sortFields) {
            const aValue = a[field] || 0;
            const bValue = b[field] || 0;
            if (aValue !== bValue) {
                return direction === 'asc' ? aValue - bValue : bValue - aValue;
            }
        }
        return 0; // If all fields are equal, maintain original order
    });
}
function filterSortPaginate(tokens, params) {
    // Filter: (Assume all tokens are valid for the period, or filter by updatedAt if needed)
    // For now, no additional filtering by time
    // Parse and apply multi-field sorting
    const sortFields = parseSortParameter(params.sort, params.time);
    const sorted = applyMultiFieldSort([...tokens], sortFields);
    // Pagination (cursor-based)
    let startIdx = 0;
    if (params.nextCursor) {
        const idx = sorted.findIndex(t => t.address === params.nextCursor);
        startIdx = idx >= 0 ? idx + 1 : 0;
    }
    const paginated = sorted.slice(startIdx, startIdx + params.limit);
    const newNextCursor = paginated.length === params.limit ? paginated[paginated.length - 1].address : undefined;
    return { tokens: paginated, nextCursor: newNextCursor };
}
//# sourceMappingURL=filterSortPaginate.js.map