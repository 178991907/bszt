"use client";

import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import type { Settings } from "@/lib/types";
import { Printer, Loader2, Download } from "lucide-react";
import { TracingCharacterGrid } from "./TracingCharacterGrid";
import { CharacterInfo } from "./CharacterInfo";
import { useCharacterData } from "@/hooks/useCharacterData";
import { usePDFGenerator } from "@/hooks/usePDFGenerator";
import { calculatePageLayout } from "@/lib/utils";

export function WorksheetPreview({ settings }: { settings: Settings }) {
  const { characterDataMap, isLoading: isDataLoading, uniqueChars, allCharsLoaded } = useCharacterData(settings.name);
  const { isDownloading, generatePDF } = usePDFGenerator();

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    generatePDF('printable-area');
  };

  const pageLayout = useMemo(() => {
    if (uniqueChars.length === 0 || !allCharsLoaded) return { canFitInOnePage: false, pages: [] };
    return calculatePageLayout(uniqueChars, settings, characterDataMap);
  }, [uniqueChars, allCharsLoaded, settings, characterDataMap]);

  const renderPracticeSheet = (char: string) => {
    const data = characterDataMap.get(char);
    if (!data) return null;

    const { details, strokesData } = data;
    const strokes = strokesData?.strokes || [];
    const strokeCount = strokes.length;
    const gridsPerRow = settings.gridCount;
    const tracingRows = Math.max(1, settings.tracingRows); // 至少重复一次

    // 创建一个完整的笔顺练习序列（笔顺描红 + 灰色描摸字填充）
    const createStrokePracticeSequence = () => {
      const sequence = [];

      // 添加笔顺描红部分
      for (let i = 0; i < strokeCount; i++) {
        sequence.push(
          <TracingCharacterGrid
            key={`stroke-${i}`}
            strokes={strokes}
            gridType={settings.gridType}
            highlightStroke={i}
            showPinyin={settings.showPinyin}
            pinyin={details.pinyin[0]}
            gridColor={settings.gridColor}
            innerGridColor={settings.innerGridColor}
            characterColor={settings.characterColor}
            tracingColor={settings.tracingColor}
            strokeColor={settings.strokeColor}
            completedStrokeColor={settings.completedStrokeColor}
            gridCount={settings.gridCount}
          />
        );
      }

      return sequence;
    };

    const allRows = [];

    if (strokeCount <= gridsPerRow) {
      // 情况 1: 笔画数 ≤ 每行格子数
      // 创建一个单行的练习序列
      const singleRowSequence = createStrokePracticeSequence();

      // 用灰色描摸字填充剩余位置
      const fillerCount = gridsPerRow - strokeCount;
      for (let i = 0; i < fillerCount; i++) {
        singleRowSequence.push(
          <TracingCharacterGrid
            key={`filler-${i}`}
            strokes={strokes}
            gridType={settings.gridType}
            isTracing={true}
            showPinyin={settings.showPinyin}
            pinyin={details.pinyin[0]}
            gridColor={settings.gridColor}
            innerGridColor={settings.innerGridColor}
            characterColor={settings.characterColor}
            tracingColor={settings.tracingColor}
            strokeColor={settings.strokeColor}
            completedStrokeColor={settings.completedStrokeColor}
            gridCount={settings.gridCount}
          />
        );
      }

      // 重复这个单行序列 N 次
      for (let row = 0; row < tracingRows; row++) {
        allRows.push(
          <div
            key={`practice-row-${row}`}
            className="grid w-full gap-1"
            style={{ gridTemplateColumns: `repeat(${gridsPerRow}, 1fr)` }}
          >
            {singleRowSequence.map((grid, index) =>
              React.cloneElement(grid as React.ReactElement, {
                key: `row-${row}-grid-${index}`
              })
            )}
          </div>
        );
      }
    } else {
      // 情况 2: 笔画数 > 每行格子数
      // 创建一个需要跨行的完整笔顺练习序列
      const fullSequence = createStrokePracticeSequence();

      // 计算需要多少行来完成一个完整的笔顺序列
      const rowsPerBlock = Math.ceil(strokeCount / gridsPerRow);
      const lastRowGridCount = strokeCount % gridsPerRow;

      // 在最后一行的末尾填充灰色描摸字
      if (lastRowGridCount > 0) {
        const fillerCount = gridsPerRow - lastRowGridCount;
        for (let i = 0; i < fillerCount; i++) {
          fullSequence.push(
            <TracingCharacterGrid
              key={`block-filler-${i}`}
              strokes={strokes}
              gridType={settings.gridType}
              isTracing={true}
              showPinyin={settings.showPinyin}
              pinyin={details.pinyin[0]}
              gridColor={settings.gridColor}
              innerGridColor={settings.innerGridColor}
              characterColor={settings.characterColor}
              tracingColor={settings.tracingColor}
              strokeColor={settings.strokeColor}
              completedStrokeColor={settings.completedStrokeColor}
              gridCount={settings.gridCount}
            />
          );
        }
      }

      // 重复这个完整的跨行“块” N 次
      for (let block = 0; block < tracingRows; block++) {
        // 将当前块的序列分解为多行
        for (let row = 0; row < rowsPerBlock; row++) {
          const startIndex = row * gridsPerRow;
          const endIndex = Math.min(startIndex + gridsPerRow, fullSequence.length);
          const rowGrids = fullSequence.slice(startIndex, endIndex);

          allRows.push(
            <div
              key={`block-${block}-row-${row}`}
              className="grid w-full gap-1"
              style={{ gridTemplateColumns: `repeat(${gridsPerRow}, 1fr)` }}
            >
              {rowGrids.map((grid, index) =>
                React.cloneElement(grid as React.ReactElement, {
                  key: `block-${block}-row-${row}-grid-${index}`
                })
              )}
            </div>
          );
        }
      }
    }

    return <div className="space-y-1">{allRows}</div>;
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4 no-print">
        <h2 className="text-xl font-bold font-headline">预览</h2>
        <div className="flex gap-2">
          <Button onClick={handlePrint} disabled={isDataLoading || isDownloading || uniqueChars.length === 0}>
            {isDataLoading ? <Loader2 className="animate-spin" /> : <Printer />}
            {isDataLoading ? "加载中..." : "打印"}
          </Button>
          <Button onClick={handleDownloadPdf} disabled={isDataLoading || isDownloading || uniqueChars.length === 0}>
            {isDownloading ? <Loader2 className="animate-spin" /> : <Download />}
            {isDownloading ? "下载中..." : "下载PDF"}
          </Button>
        </div>
      </div>

      <div id="printable-area" className="printable-area">
        {pageLayout.pages.length > 0 ? (
          <div className="character-pages">
            {pageLayout.pages.map((pageChars, pageIndex) => (
              <div key={`page-${pageIndex}`} className="character-page">
                {/* 页眉 */}
                <div className="page-header flex items-center justify-between p-2 border-b bg-background">
                  <div className="flex items-center space-x-3">
                    <img
                      src="/images/logo.png"
                      alt="字帖生成器 Logo"
                      className="h-12 w-36 rounded object-contain"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjY0IiB2aWV3Qm94PSIwIDAgMTkyIDY0IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTkyIiBoZWlnaHQ9IjY0IiByeD0iOCIgZmlsbD0iIzM0ODNmYSIvPgo8dGV4dCB4PSI5NiIgeT0iNDAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7lrZfluJY8L3RleHQ+Cjwvc3ZnPgo=';
                      }}
                    />
                  </div>
                  <div className="flex-1 text-center">
                    <h1 className="text-2xl font-bold text-foreground">笔顺字帖</h1>
                  </div>
                  <div className="w-36 text-right text-sm text-muted-foreground">
                    {pageLayout.canFitInOnePage ?
                      `全部/${uniqueChars.length}字` :
                      `${pageIndex + 1}/${pageLayout.pages.length}`
                    }
                  </div>
                </div>

                {/* 主内容 */}
                <div className="page-content p-4 sm:p-6">
                  <div className={pageLayout.canFitInOnePage ? "space-y-6" : "space-y-2"}>
                    {pageChars.map((char) => {
                      const data = characterDataMap.get(char);
                      if (!data) return null;

                      const { details, strokesData } = data;
                      const strokes = strokesData?.strokes || [];
                      const strokeCount = strokes.length;

                      return (
                        <div key={`${pageIndex}-${char}`} className={pageLayout.canFitInOnePage ? "character-section border-b border-gray-100 pb-4 last:border-b-0" : "character-section"}>
                          <div className="flex gap-4 items-center mb-2">
                            <TracingCharacterGrid
                              strokes={strokes}
                              gridType={settings.gridType}
                              isExample={true}
                              gridColor={settings.gridColor}
                              innerGridColor={settings.innerGridColor}
                              characterColor={settings.characterColor}
                              tracingColor={settings.tracingColor}
                              strokeColor={settings.strokeColor}
                              completedStrokeColor={settings.completedStrokeColor}
                            />
                            <div className="flex-1">
                              <CharacterInfo details={details} strokeCount={strokeCount} />
                            </div>
                          </div>
                          {renderPracticeSheet(char)}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 页脚 */}
                <div className="page-footer border-t p-2 bg-background mt-auto">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      英语全科启蒙网站导航:
                      <span className="text-primary ml-1">
                        https://web.terry.dpdns.org/
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="character-page">
            <div className="flex items-center justify-center h-96 text-muted-foreground">
              {uniqueChars.length === 0 ?
                "请在左侧输入姓名以生成字帖" :
                "正在加载汉字数据..."
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
