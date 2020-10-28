import _locateJavaHome from "locate-java-home";

/**
 * Locates Java home with version = 1.8.
 */
export default function locateJavaHome(configuredJavaHome: string | undefined): Promise<string> {
  return new Promise((resolve, reject) => {
    if (configuredJavaHome === undefined || configuredJavaHome.length === 0) {
      _locateJavaHome({ version: "=1.8" }, function (error, javaHomes) {
        if (!javaHomes || javaHomes.length === 0) {
          reject("No suitable Java version found");
        } else {
          const jdkHome = javaHomes.find((j) => j.isJDK);
          if (jdkHome) {
            resolve(jdkHome.path);
          } else {
            resolve(javaHomes[0].path);
          }
        }
      });
    } else {
      resolve(configuredJavaHome);
    }
  });
}
