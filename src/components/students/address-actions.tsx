"use client";

import { MapPin, ExternalLink, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function naverMapUrl(address: string): string {
  return `https://map.naver.com/v5/search/${encodeURIComponent(address)}`;
}

export function kakaoMapUrl(address: string): string {
  return `https://map.kakao.com/?q=${encodeURIComponent(address)}`;
}

export function AddressActions({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  if (!address.trim()) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success("주소가 복사되었습니다.");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("복사에 실패했습니다.");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1.5 px-2 -ml-1">
          <MapPin className="size-3.5" />
          <span className="truncate max-w-[14rem]">{address}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem asChild>
          <a href={naverMapUrl(address)} target="_blank" rel="noreferrer" className="flex items-center gap-2">
            <ExternalLink className="size-3.5" />
            네이버 지도에서 열기
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={kakaoMapUrl(address)} target="_blank" rel="noreferrer" className="flex items-center gap-2">
            <ExternalLink className="size-3.5" />
            카카오맵에서 열기
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={copy}>
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          주소 복사
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
