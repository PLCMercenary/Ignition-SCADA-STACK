TAG_NAME="Name"
INSTANCE_ID="`wget -qO- http://169.254.169.254/latest/meta-data/instance-id`"
REGION="`wget -qO- http://169.254.169.254/latest/meta-data/placement/availability-zone | sed -e 's:\([0-9][0-9]*\)[a-z]*\$:\\1:'`"
TAG_VALUE="`aws ec2 describe-tags --filters "Name=resource-id,Values=$INSTANCE_ID" "Name=key,Values=$TAG_NAME" --region $REGION --output=text | cut -f5`"
echo $TAG_VALUE
