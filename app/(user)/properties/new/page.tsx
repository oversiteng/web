"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    ArrowLeftIcon as ArrowLeft,
    TargetIcon as Crosshair,
    AltArrowDownIcon as ChevronDown,
    InfoCircleIcon as InfoIcon,
    MapPointIcon as MapPinIcon,
    MagnifierIcon as SearchIcon,
    CheckCircleIcon as CheckIcon,
    DangerTriangleIcon as AlertTriangle,
} from "@solar-icons/react/outline";
import { ThemeToggle } from "@/components/ThemeToggle";
import dynamic from "next/dynamic";

const OpenFreeMapView = dynamic(() => import("@/components/OpenFreeMapView"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-48 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center text-xs text-[var(--text-muted)] animate-pulse">
            Loading OpenFreeMap...
        </div>
    ),
});

interface PropertyFormState {
    address: string;
    gps: string;
    nickname: string;
    type: string;
}

export default function RegisterPropertyPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const returnUrl = searchParams.get("returnUrl");

    const [form, setForm] = useState<PropertyFormState>({
        address: "",
        gps: "",
        nickname: "",
        type: "",
    });
    const [isLocating, setIsLocating] = useState(false);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [distanceWarning, setDistanceWarning] = useState<string | null>(null);
    const [geocodedAddressSuggestion, setGeocodedAddressSuggestion] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [showMapPicker, setShowMapPicker] = useState(false);

    // Parse lat/lng from form.gps if present
    const parsedCoordinates = (() => {
        if (!form.gps || !form.gps.includes(",")) return { lat: 6.4281, lng: 3.4219 };
        const parts = form.gps.split(",").map((p) => parseFloat(p.trim()));
        if (!isNaN(parts[0]) && !isNaN(parts[1])) {
            return { lat: parts[0], lng: parts[1] };
        }
        return { lat: 6.4281, lng: 3.4219 };
    })();

    const showToast = (msg: string, duration = 3500) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), duration);
    };

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (name === "address") {
            setDistanceWarning(null);
            setGeocodedAddressSuggestion(null);
        }
    };

    // Forward Geocode: Converts the typed address into accurate property GPS coordinates
    const handleGeocodeAddress = async (overrideAddress?: string) => {
        const targetAddress = (overrideAddress || form.address || "").trim();
        if (!targetAddress || targetAddress.length < 3) {
            showToast("Please enter a property address first.");
            return;
        }

        setIsGeocoding(true);
        showToast("Locating property address on satellite map...");
        try {
            const res = await fetch(`/api/v1/geo?address=${encodeURIComponent(targetAddress)}`);
            const json = await res.json();
            if (json.success && json.data) {
                const { latitude, longitude, displayName } = json.data;
                const coords = `${latitude}, ${longitude}`;
                setForm((prev) => ({ ...prev, gps: coords }));
                setGeocodedAddressSuggestion(displayName);
                setDistanceWarning(null);
                setShowMapPicker(true);
                showToast(`Address mapped: ${latitude}, ${longitude}`);
            } else {
                showToast("Could not auto-locate address. Please click 'Pin on Map' to set pin.");
            }
        } catch (err) {
            console.error("Geocoding failed:", err);
            showToast("Location service busy. Please pin manually on map.");
        } finally {
            setIsGeocoding(false);
        }
    };

    // Device GPS: Uses device geolocation, with distance warning if far from entered address
    const handleFindCoordinate = () => {
        if (!navigator.geolocation) {
            showToast("Geolocation is not supported by your browser.");
            return;
        }

        setIsLocating(true);
        showToast("Fetching current device coordinates...");
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const userLat = pos.coords.latitude;
                const userLng = pos.coords.longitude;
                const coords = `${userLat.toFixed(6)}, ${userLng.toFixed(6)}`;
                setForm((prev) => ({ ...prev, gps: coords }));
                setIsLocating(false);
                setShowMapPicker(true);
                showToast(`Device coordinates: ${coords}`);

                // Compare with address if user already entered an address
                if (form.address && form.address.trim().length >= 3) {
                    try {
                        const checkRes = await fetch(
                            `/api/v1/geo?address=${encodeURIComponent(form.address)}&compareLat=${userLat}&compareLng=${userLng}`
                        );
                        const checkJson = await checkRes.json();
                        if (checkJson.success && checkJson.data?.distanceFromUserKm != null) {
                            const km = checkJson.data.distanceFromUserKm;
                            if (km > 10) {
                                setDistanceWarning(
                                    `Notice: Your current device location is ~${km}km away from '${form.address}'. If you are not physically standing at the property, click 'Locate Address' to lock the property's coordinates.`
                                );
                            } else {
                                setDistanceWarning(null);
                            }
                        }
                    } catch {
                        // ignore distance check errors
                    }
                }
            },
            (err) => {
                console.error("Location lookup error:", err);
                showToast("Unable to fetch current location. Check browser permissions.");
                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            let lat: number | undefined;
            let lng: number | undefined;
            if (form.gps && form.gps.includes(",")) {
                const parts = form.gps.split(",").map(p => parseFloat(p.trim()));
                if (!isNaN(parts[0]) && !isNaN(parts[1])) {
                    lat = parts[0];
                    lng = parts[1];
                }
            }

            const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (token) headers["Authorization"] = `Bearer ${token}`;

            const res = await fetch("/api/v1/properties", {
                method: "POST",
                headers,
                body: JSON.stringify({
                    title: form.nickname || form.address,
                    address: form.address,
                    latitude: lat,
                    longitude: lng,
                    propertyType: form.type,
                }),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                showToast(data.error?.message || "Failed to add property");
                setIsSubmitting(false);
                return;
            }

            showToast("Property added successfully!");
            setTimeout(() => {
                if (returnUrl) {
                    router.push(returnUrl);
                } else {
                    router.push("/properties");
                }
            }, 600);
        } catch (err) {
            console.error("Registration failed:", err);
            showToast("Network error. Please try again.");
            setIsSubmitting(false);
        }
    };

    const [typeDrawerOpen, setTypeDrawerOpen] = useState(false);

    const PROPERTY_TYPES = [
        { id: "underdeveloped_land", label: "Underdeveloped Land", desc: "Vacant plots, uncultivated acreage, greenfield sites" },
        { id: "residential_building", label: "Residential Building", desc: "Duplexes, bungalows, apartment blocks, residential homes" },
        { id: "commercial_building", label: "Commercial Building", desc: "Offices, plazas, shopping complexes, commercial facilities" },
        { id: "under_construction", label: "Under Construction", desc: "Ongoing developments, active foundations, structural works" },
    ];

    const selectedTypeObj = PROPERTY_TYPES.find((t) => t.id === form.type);

    return (
        <div className="relative w-full text-[var(--text-body)] transition-colors duration-200">
            {/* ── Toast Notification Banner ── */}
            {toastMessage && (
                <div className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none transition-all duration-300">
                    <div className="w-full max-w-md bg-[#003882] text-white px-4 py-3 rounded-2xl shadow-2xl border border-blue-400/30 flex items-center gap-3 backdrop-blur-md animate-in fade-in slide-in-from-top-4">
                        <InfoIcon size={20} className="text-white shrink-0" />
                        <span className="text-[13px] font-medium tracking-wide">
                            {toastMessage}
                        </span>
                    </div>
                </div>
            )}

            <div className="max-w-md mx-auto flex flex-col justify-between py-1 sm:py-2">
                {/* ── Top Bar ── */}
                <div>
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            aria-label="Go back"
                            className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <ThemeToggle />
                    </div>

                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-heading)] mb-4 sm:mb-5">
                        Register a property
                    </h1>

                    {/* ── Form Fields ── */}
                    <form id="register-property-form" onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
                        {/* Address */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label
                                    htmlFor="address"
                                    className="block text-[13px] font-semibold text-[var(--text-heading)]"
                                >
                                    Property Address
                                </label>
                                <button
                                    type="button"
                                    onClick={() => handleGeocodeAddress()}
                                    disabled={isGeocoding || !form.address}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:opacity-85 transition-opacity disabled:opacity-40 cursor-pointer"
                                    title="Find coordinates for this address on map"
                                >
                                    <SearchIcon size={14} className={isGeocoding ? "animate-spin" : ""} />
                                    <span>{isGeocoding ? "Locating..." : "Locate Address"}</span>
                                </button>
                            </div>
                            <input
                                id="address"
                                name="address"
                                type="text"
                                required
                                value={form.address}
                                onChange={handleInputChange}
                                onBlur={() => {
                                    if (form.address && form.address.trim().length >= 4 && !form.gps) {
                                        handleGeocodeAddress();
                                    }
                                }}
                                placeholder="e.g. Lekki Phase 1, Lagos"
                                className="w-full px-4.5 py-3 sm:py-3.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] border border-[var(--border-color)] text-[14px] outline-none focus:ring-2 focus:ring-[var(--primary)]/40 transition-all shadow-xs"
                            />
                            {geocodedAddressSuggestion && (
                                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 px-1 pt-0.5">
                                    <CheckIcon size={13} className="shrink-0" />
                                    <span className="truncate">Verified Location: {geocodedAddressSuggestion}</span>
                                </p>
                            )}
                        </div>

                        {/* GPS Coordinates */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label
                                    htmlFor="gps"
                                    className="block text-[13px] font-semibold text-[var(--text-heading)]"
                                >
                                    GPS coordinates{" "}
                                    <span className="text-[var(--text-muted)] font-normal text-xs">
                                        (auto-mapped)
                                    </span>
                                </label>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowMapPicker((prev) => !prev)}
                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--primary)] hover:opacity-85 transition-opacity cursor-pointer"
                                    >
                                        <MapPinIcon size={14} />
                                        <span>{showMapPicker ? "Hide Map" : "Pin on Map"}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleFindCoordinate}
                                        disabled={isLocating}
                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors disabled:opacity-50 cursor-pointer"
                                        title="Only use if you are physically at the property right now"
                                    >
                                        <Crosshair
                                            size={14}
                                            className={isLocating ? "animate-spin" : ""}
                                        />
                                        <span>{isLocating ? "Detecting..." : "Use Device GPS"}</span>
                                    </button>
                                </div>
                            </div>

                            <input
                                id="gps"
                                name="gps"
                                type="text"
                                value={form.gps}
                                onChange={handleInputChange}
                                placeholder="e.g. 6.4281, 3.4219"
                                className="w-full px-4.5 py-3 sm:py-3.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] border border-[var(--border-color)] text-[14px] outline-none focus:ring-2 focus:ring-[var(--primary)]/40 transition-all shadow-xs"
                            />

                            {/* Distance Discrepancy Notice */}
                            {distanceWarning && (
                                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-start gap-2.5 animate-in fade-in">
                                    <AlertTriangle size={18} className="shrink-0 mt-0.5 text-amber-500" />
                                    <div className="flex-1 space-y-1">
                                        <p className="leading-relaxed">{distanceWarning}</p>
                                        <button
                                            type="button"
                                            onClick={() => handleGeocodeAddress()}
                                            className="text-xs font-bold text-[var(--primary)] hover:underline cursor-pointer block mt-1"
                                        >
                                            → Lock Pin to Address Location
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* OpenFreeMap Interactive Map Pin Picker */}
                            {showMapPicker && (
                                <div className="pt-2 animate-in fade-in duration-200">
                                    <OpenFreeMapView
                                        latitude={parsedCoordinates.lat}
                                        longitude={parsedCoordinates.lng}
                                        zoom={14}
                                        height="240px"
                                        enablePicker={true}
                                        interactive={true}
                                        showControls={true}
                                        onLocationSelect={(coords) => {
                                            const formatted = `${coords.latitude}, ${coords.longitude}`;
                                            setForm((prev) => ({
                                                ...prev,
                                                gps: formatted,
                                                address: !prev.address && coords.address ? coords.address : prev.address,
                                            }));
                                            if (coords.address) {
                                                setGeocodedAddressSuggestion(coords.address);
                                            }
                                            setDistanceWarning(null);
                                            showToast(`Map pin locked: ${formatted}`, 2000);
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Nickname */}
                        <div className="space-y-1.5">
                            <label
                                htmlFor="nickname"
                                className="block text-[13px] font-semibold text-[var(--text-heading)]"
                            >
                                Give it a nickname
                            </label>
                            <input
                                id="nickname"
                                name="nickname"
                                type="text"
                                value={form.nickname}
                                onChange={handleInputChange}
                                placeholder="Lekki duplex"
                                className="w-full px-4.5 py-3 sm:py-3.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] border border-[var(--border-color)] text-[14px] outline-none focus:ring-2 focus:ring-[var(--primary)]/40 transition-all shadow-xs"
                            />
                        </div>

                        {/* Property Type Custom Drawer / Modal Trigger */}
                        <div className="space-y-1.5">
                            <label
                                htmlFor="type-trigger"
                                className="block text-[13px] font-semibold text-[var(--text-heading)]"
                            >
                                Property type
                            </label>
                            <button
                                id="type-trigger"
                                type="button"
                                onClick={() => setTypeDrawerOpen(true)}
                                className="w-full px-4.5 py-3 sm:py-3.5 rounded-full bg-[var(--bg-secondary)] text-left flex items-center justify-between border border-[var(--border-color)] text-[14px] outline-none focus:ring-2 focus:ring-[var(--primary)]/40 hover:border-[var(--primary)]/40 transition-all cursor-pointer shadow-xs active:scale-[0.99]"
                            >
                                <span
                                    className={
                                        selectedTypeObj
                                            ? "font-medium text-[var(--text-heading)]"
                                            : "text-[var(--text-muted)]"
                                    }
                                >
                                    {selectedTypeObj ? selectedTypeObj.label : "Select type"}
                                </span>
                                <ChevronDown
                                    size={16}
                                    className={`text-[var(--text-muted)] transition-transform duration-200 ${typeDrawerOpen ? "rotate-180" : ""
                                        }`}
                                />
                            </button>
                        </div>
                    </form>
                </div>

                {/* ── Submit Button ── */}
                <div className="pt-5 sm:pt-6">
                    <button
                        type="submit"
                        form="register-property-form"
                        disabled={!form.address.trim() || !form.type || isSubmitting}
                        className="w-full py-3.5 sm:py-4 rounded-full bg-[var(--primary)] text-white font-semibold text-[15px] hover:bg-[var(--primary-hover)] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
                    >
                        {isSubmitting ? "Adding property..." : "Add property"}
                    </button>
                </div>
            </div>

            {/* ── Responsive Property Type Selection: Bottom Drawer on Mobile, Centered Modal on Desktop ── */}
            {typeDrawerOpen && (
                <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
                        onClick={() => setTypeDrawerOpen(false)}
                    />

                    {/* Sheet / Modal Container */}
                    <div
                        className="relative w-full sm:max-w-md bg-[var(--bg-card)] border-t sm:border border-[var(--border-color)] rounded-t-[28px] sm:rounded-3xl p-5 pb-8 sm:p-6 sm:pb-6 shadow-2xl transition-all duration-300 animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-2 sm:zoom-in-95 z-10 max-h-[85vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Mobile Bottom-sheet Pull Handle (Hidden on Desktop) */}
                        <div className="w-10 h-1 rounded-full bg-[var(--border-color)] mx-auto mb-4 sm:hidden shrink-0" />

                        {/* Drawer Header */}
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--border-color)] shrink-0">
                            <div>
                                <h2 className="text-[16px] font-bold text-[var(--text-heading)]">
                                    Select property type
                                </h2>
                                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                                    Choose the category that best matches this property
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setTypeDrawerOpen(false)}
                                className="w-7 h-7 rounded-full bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-heading)] flex items-center justify-center transition-colors cursor-pointer text-[13px]"
                                aria-label="Close"
                            >
                                ✕
                            </button>
                        </div>

                        {/* List Options — Sleek, Borderless & Compact */}
                        <div className="space-y-1 overflow-y-auto pr-1 -mr-1 max-h-[55vh]">
                            {PROPERTY_TYPES.map((pt) => {
                                const isSelected = form.type === pt.id;
                                return (
                                    <button
                                        key={pt.id}
                                        type="button"
                                        onClick={() => {
                                            setForm((prev) => ({ ...prev, type: pt.id }));
                                            setTypeDrawerOpen(false);
                                        }}
                                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all cursor-pointer active:scale-[0.99] ${
                                            isSelected
                                                ? "bg-[var(--primary)]/10 text-[var(--text-heading)]"
                                                : "hover:bg-[var(--bg-secondary)] text-[var(--text-heading)]"
                                        }`}
                                    >
                                        <div className="pr-3 min-w-0">
                                            <p
                                                className={`text-[13.5px] font-semibold leading-tight ${
                                                    isSelected
                                                        ? "text-[var(--primary)]"
                                                        : "text-[var(--text-heading)]"
                                                }`}
                                            >
                                                {pt.label}
                                            </p>
                                            <p className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate">
                                                {pt.desc}
                                            </p>
                                        </div>

                                        {/* Minimal Radio Circle Indicator */}
                                        <div
                                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                                                isSelected
                                                    ? "border-[var(--primary)] bg-[var(--primary)]"
                                                    : "border-[var(--border-color)] bg-transparent"
                                            }`}
                                        >
                                            {isSelected && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}