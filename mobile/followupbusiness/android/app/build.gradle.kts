import java.util.Properties

plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

val localReleaseProperties = Properties().apply {
    val localFile = rootProject.file("key.properties")
    if (localFile.isFile) {
        localFile.inputStream().use(::load)
    }
}

fun releaseSigningValue(environmentName: String, propertyName: String): String? =
    providers.environmentVariable(environmentName).orNull
        ?.takeIf { it.isNotBlank() }
        ?: localReleaseProperties.getProperty(propertyName)?.takeIf { it.isNotBlank() }

val releaseStoreFile = releaseSigningValue("FUB_RELEASE_STORE_FILE", "storeFile")
val releaseStorePassword = releaseSigningValue("FUB_RELEASE_STORE_PASSWORD", "storePassword")
val releaseKeyAlias = releaseSigningValue("FUB_RELEASE_KEY_ALIAS", "keyAlias")
val releaseKeyPassword = releaseSigningValue("FUB_RELEASE_KEY_PASSWORD", "keyPassword")
val isReleaseRequested = gradle.startParameter.taskNames.any {
    it.contains("release", ignoreCase = true)
}

android {
    namespace = "com.example.followupbusiness"
    compileSdk = 37
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    defaultConfig {
        // TODO: Specify your own unique Application ID (https://developer.android.com/studio/build/application-id.html).
        applicationId = "com.example.followupbusiness"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = 29
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    signingConfigs {
        create("release") {
            if (isReleaseRequested) {
                check(
                    releaseStoreFile != null &&
                        releaseStorePassword != null &&
                        releaseKeyAlias != null &&
                        releaseKeyPassword != null,
                ) {
                    "La firma release requiere FUB_RELEASE_STORE_FILE, " +
                        "FUB_RELEASE_STORE_PASSWORD, FUB_RELEASE_KEY_ALIAS y " +
                        "FUB_RELEASE_KEY_PASSWORD; alternativamente android/key.properties " +
                        "local e ignorado."
                }
                storeFile = rootProject.file(releaseStoreFile)
                storePassword = releaseStorePassword
                keyAlias = releaseKeyAlias
                keyPassword = releaseKeyPassword
            }
        }
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}
