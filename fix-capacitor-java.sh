# OVERRIDE: Force Java 17 after any Capacitor sync
sed -i 's/JavaVersion.VERSION_21/JavaVersion.VERSION_17/g' android/app/capacitor.build.gradle
