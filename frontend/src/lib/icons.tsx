"use client";
import React from "react";
import {
  AlignCenterVertical as PAlignCenterVertical,
  ArrowCounterClockwise as PArrowCounterClockwise,
  ArrowRight as PArrowRight,
  ArrowUpRight as PArrowUpRight,
  ArrowsClockwise as PArrowsClockwise,
  ArrowsOutCardinal as PArrowsOutCardinal,
  BookOpen as PBookOpen,
  Calculator as PCalculator,
  Camera as PCamera,
  CaretDown as PCaretDown,
  CaretLeft as PCaretLeft,
  CaretRight as PCaretRight,
  ChatCircle as PChatCircle,
  CheckCircle as PCheckCircle,
  CircleNotch as PCircleNotch,
  ClipboardText as PClipboardText,
  Clock as PClock,
  Cookie as PCookie,
  Copy as PCopy,
  CreditCard as PCreditCard,
  DeviceMobile as PDeviceMobile,
  DownloadSimple as PDownloadSimple,
  EnvelopeSimple as PEnvelopeSimple,
  Eye as PEye,
  EyeSlash as PEyeSlash,
  FileArrowDown as PFileArrowDown,
  FileArrowUp as PFileArrowUp,
  FileText as PFileText,
  FloppyDisk as PFloppyDisk,
  Folder as PFolder,
  Heart as PHeart,
  Image as PImage,
  ImageBroken as PImageBroken,
  Info as PInfo,
  Key as PKey,
  Layout as PLayout,
  Lightning as PLightning,
  List as PList,
  MagicWand as PMagicWand,
  MagnifyingGlass as PMagnifyingGlass,
  MagnifyingGlassMinus as PMagnifyingGlassMinus,
  MagnifyingGlassPlus as PMagnifyingGlassPlus,
  MapPin as PMapPin,
  Medal as PMedal,
  Minus as PMinus,
  Package as PPackage,
  Palette as PPalette,
  Pause as PPause,
  PenNib as PPenNib,
  PencilLine as PPencilLine,
  PencilSimple as PPencilSimple,
  Phone as PPhone,
  Play as PPlay,
  Plus as PPlus,
  Printer as PPrinter,
  QrCode as PQrCode,
  Scan as PScan,
  ShieldCheck as PShieldCheck,
  ShoppingBag as PShoppingBag,
  ShoppingCart as PShoppingCart,
  SignOut as PSignOut,
  SquaresFour as PSquaresFour,
  StackSimple as PStackSimple,
  Star as PStar,
  TextAlignCenter as PTextAlignCenter,
  TextAlignLeft as PTextAlignLeft,
  TextAlignRight as PTextAlignRight,
  TextT as PTextT,
  Trash as PTrash,
  TrendUp as PTrendUp,
  Truck as PTruck,
  UploadSimple as PUploadSimple,
  User as PUser,
  WarningCircle as PWarningCircle,
  X as PX,
  XCircle as PXCircle,
} from "@phosphor-icons/react";

type AnyProps = { strokeWidth?: number; weight?: any; size?: number | string; className?: string; [k: string]: any };

function make(C: React.ComponentType<any>) {
  const Icon = ({ strokeWidth, weight, ...rest }: AnyProps) => <C weight={weight ?? "duotone"} {...rest} />;
  return Icon;
}

export const AlertCircle = make(PWarningCircle);
export const AlignCenter = make(PTextAlignCenter);
export const AlignLeft = make(PTextAlignLeft);
export const AlignRight = make(PTextAlignRight);
export const AlignVerticalJustifyCenter = make(PAlignCenterVertical);
export const ArrowRight = make(PArrowRight);
export const ArrowUpRight = make(PArrowUpRight);
export const Award = make(PMedal);
export const BookOpen = make(PBookOpen);
export const Calculator = make(PCalculator);
export const Camera = make(PCamera);
export const CheckCircle = make(PCheckCircle);
export const CheckCircle2 = make(PCheckCircle);
export const ChevronDown = make(PCaretDown);
export const ChevronLeft = make(PCaretLeft);
export const ChevronRight = make(PCaretRight);
export const ClipboardList = make(PClipboardText);
export const Clock = make(PClock);
export const Cookie = make(PCookie);
export const Copy = make(PCopy);
export const CreditCard = make(PCreditCard);
export const Download = make(PDownloadSimple);
export const Eye = make(PEye);
export const EyeOff = make(PEyeSlash);
export const FileCheck2 = make(PFileArrowUp);
export const FileDown = make(PFileArrowDown);
export const FileText = make(PFileText);
export const Folder = make(PFolder);
export const Heart = make(PHeart);
export const Image = make(PImage);
export const ImageOff = make(PImageBroken);
export const Info = make(PInfo);
export const KeyRound = make(PKey);
export const Layers = make(PStackSimple);
export const LayoutGrid = make(PSquaresFour);
export const LayoutTemplate = make(PLayout);
export const Loader2 = make(PCircleNotch);
export const LogOut = make(PSignOut);
export const Mail = make(PEnvelopeSimple);
export const MailWarning = make(PEnvelopeSimple);
export const MapPin = make(PMapPin);
export const Menu = make(PList);
export const MessageCircle = make(PChatCircle);
export const Minus = make(PMinus);
export const Move3d = make(PArrowsOutCardinal);
export const Package = make(PPackage);
export const Package2 = make(PPackage);
export const Palette = make(PPalette);
export const Pause = make(PPause);
export const PenLine = make(PPencilLine);
export const PenTool = make(PPenNib);
export const Pencil = make(PPencilSimple);
export const Phone = make(PPhone);
export const Play = make(PPlay);
export const Plus = make(PPlus);
export const Printer = make(PPrinter);
export const QrCode = make(PQrCode);
export const RefreshCw = make(PArrowsClockwise);
export const RotateCcw = make(PArrowCounterClockwise);
export const Save = make(PFloppyDisk);
export const ScanLine = make(PScan);
export const Search = make(PMagnifyingGlass);
export const ShieldCheck = make(PShieldCheck);
export const ShoppingBag = make(PShoppingBag);
export const ShoppingCart = make(PShoppingCart);
export const Smartphone = make(PDeviceMobile);
export const Star = make(PStar);
export const Trash2 = make(PTrash);
export const TrendingUp = make(PTrendUp);
export const Truck = make(PTruck);
export const Type = make(PTextT);
export const Upload = make(PUploadSimple);
export const User = make(PUser);
export const Wand2 = make(PMagicWand);
export const X = make(PX);
export const XCircle = make(PXCircle);
export const Zap = make(PLightning);
export const ZoomIn = make(PMagnifyingGlassPlus);
export const ZoomOut = make(PMagnifyingGlassMinus);
