# 原版 Runtime 真正结构差异

第一轮 layout diff 已证明 collision / Ice R 的分叉只是 local-variable slot 布局。第二层 structural fingerprint 后，UP02～UP09 只有 Loader 仍分成两组。本报告只保留 Loader 的 structural diff。

## Loader: UP02-family → UP09-family

```diff
--- up02-loader
+++ up09-loader
@@ -322,23 +322,23 @@
 goto <target>
 Exception table:
 from    to  target type
-9    24   644   Class java/lang/Exception
-35    73   644   Class java/lang/Exception
-80    87   644   Class java/lang/Exception
-87    96   644   Class java/lang/Exception
-127   171   644   Class java/lang/Exception
-173   192   644   Class java/lang/Exception
-198   218   644   Class java/lang/Exception
-220   228   644   Class java/lang/Exception
-230   248   644   Class java/lang/Exception
-260   336   644   Class java/lang/Exception
-346   367   644   Class java/lang/Exception
-461   474   644   Class java/lang/Exception
-480   535   644   Class java/lang/Exception
-544   574   644   Class java/lang/Exception
-577   592   644   Class java/lang/Exception
-595   610   644   Class java/lang/Exception
-613   628   644   Class java/lang/Exception
-631   641   644   Class java/lang/Exception
-651   656   644   Class java/lang/Exception
+9    24   640   Class java/lang/Exception
+35    71   640   Class java/lang/Exception
+78    85   640   Class java/lang/Exception
+85    94   640   Class java/lang/Exception
+125   169   640   Class java/lang/Exception
+171   190   640   Class java/lang/Exception
+196   216   640   Class java/lang/Exception
+218   226   640   Class java/lang/Exception
+228   246   640   Class java/lang/Exception
+258   334   640   Class java/lang/Exception
+344   365   640   Class java/lang/Exception
+457   470   640   Class java/lang/Exception
+476   531   640   Class java/lang/Exception
+540   570   640   Class java/lang/Exception
+573   588   640   Class java/lang/Exception
+591   606   640   Class java/lang/Exception
+609   624   640   Class java/lang/Exception
+627   637   640   Class java/lang/Exception
+647   652   640   Class java/lang/Exception
 
```
