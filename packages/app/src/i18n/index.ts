// Copyright (c) 2025 Aevarkan
// Licensed under the GPLv3 license

import en from './locales/en'

import { createI18n } from 'vue-i18n'

const i18n = createI18n({
  locale: "en", // will be set by message from VS Code
  fallbackLocale: "en",
  messages: {
    en
  }
})

export default i18n
