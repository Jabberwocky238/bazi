#!/bin/bash

# 检查 src 目录下所有 ts/tsx 文件中是否存在从外部模块直接导出的情况
# 例如: export {xxx} from "some-external-module"

echo "=== 检查外部模块导出 ==="
echo ""

EXTERNAL_PATTERNS=(
    "@jabberwocky/bazi-engine"
    "@jabberwocky"
    "node:"
)

SRC_DIR="/Users/jw238/coding/__trash__/bazi/src"
FOUND_ISSUES=0

echo "正在扫描: $SRC_DIR"
echo ""

# 检查所有 ts/tsx 文件
while IFS= read -r -d '' file; do
    # 检查 export ... from 语法
    while IFS= read -r line; do
        # 提取 from 后面的模块名
        if [[ "$line" =~ from[[:space:]]+[\'\"]([^\'\"]+)[\'\"] ]]; then
            module="${BASH_REMATCH[1]}"

            # 检查是否是相对路径导入（相对路径是允许的）
            if [[ "$module" == .* ]]; then
                continue
            fi

            # 检查是否匹配外部模块模式
            for pattern in "${EXTERNAL_PATTERNS[@]}"; do
                if [[ "$module" == "$pattern"* ]]; then
                    echo "❌ 发现外部导出:"
                    echo "   文件: ${file#$SRC_DIR/}"
                    echo "   代码: $line"
                    echo "   模块: $module"
                    echo ""
                    FOUND_ISSUES=$((FOUND_ISSUES + 1))
                    break
                fi
            done
        fi
    done < <(grep -n "export.*from" "$file" 2>/dev/null)
done < <(find "$SRC_DIR" -type f \( -name "*.ts" -o -name "*.tsx" \) -print0)

if [ $FOUND_ISSUES -eq 0 ]; then
    echo "✅ 未发现外部模块导出问题"
    exit 0
else
    echo "❌ 总计发现 $FOUND_ISSUES 个外部模块导出问题"
    exit 1
fi
