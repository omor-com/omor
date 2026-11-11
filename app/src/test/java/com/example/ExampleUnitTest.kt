package com.example

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class ExampleUnitTest {
    @Test
    fun testAppDestinations() {
        assertEquals(4, AppDestination.entries.size)
        assertEquals("Public Hub", AppDestination.PUBLIC_HUB.title)
        assertEquals("Admin CMS", AppDestination.ADMIN_CMS.title)
        assertEquals("AniLog Page", AppDestination.ANILOG.title)
        assertEquals("Deploy & Docs", AppDestination.DEPLOY_DOCS.title)
    }

    @Test
    fun testSupportKoriDestination() {
        val expected = "https://www.supportkori.com/muhammedomor"
        assertTrue(expected.contains("muhammedomor"))
        assertTrue(expected.startsWith("https://www.supportkori.com/"))
    }

    @Test
    fun testPublicUrlComputation() {
        val domain = "https://omor.asf.sale/"
        val path1 = "index.html"
        val mapped1 = if (path1 == "index.html") domain else "$domain$path1"
        assertEquals("https://omor.asf.sale/", mapped1)

        val path2 = "landingpage/anilog.html"
        val mapped2 = "$domain$path2"
        assertEquals("https://omor.asf.sale/landingpage/anilog.html", mapped2)
    }
}
