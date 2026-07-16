# Makefile for Spin
SRCS=*.java

all:	$(SRCS)
	javac --release 11 -d classes -cp classes $(SRCS)
	jar cfm Spin.jar Manifest.txt -C classes .
