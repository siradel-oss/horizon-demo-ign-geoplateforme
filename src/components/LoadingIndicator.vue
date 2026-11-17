<template>
    <div class="backdrop-blur-md rounded bg-slate-700/30">
        <div class="w-60 h-1 overflow-hidden">
            <div class="absolute w-4 h-1 bg-slate-200 rounded-sm animate-bounce-horizontal"></div>
        </div>
    </div>
</template>

<style scoped>
@keyframes bounce-horizontal {
    0%,
    100% {
        transform: translateX(0);
    }
    50% {
        transform: translateX(calc(14rem));
    }
}

.animate-bounce-horizontal {
    animation: bounce-horizontal 1.5s ease-in-out infinite;
}
</style>
