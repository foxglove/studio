#!/usr/bin/env bash

mkdir -p ~/catkin_ws/src
cd ~/catkin_ws/
source /opt/ros/noetic/setup.bash
catkin_make
source ~/catkin_ws/devel/setup.bash

roscore &

rosrun turtlesim turtlesim_node
